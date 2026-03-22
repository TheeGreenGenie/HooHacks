"""
Stock prediction inference module.

Loads the pre-trained Keras Transformer model (best_model.keras) and exposes
a single `predict(dataframe)` function that returns lower/upper bounds,
expected value, and confidence score for the next trading day.

Training code is intentionally excluded — the model is pre-trained.
"""
from __future__ import annotations

import os
import numpy as np
import pandas as pd
from sklearn.preprocessing import StandardScaler

# Lazy-load TensorFlow to avoid slow startup when not needed
_model = None
_MODEL_PATH = os.path.join(os.path.dirname(__file__), "best_model.keras")

BASE_FEATURES = ["open", "high", "low", "close", "volume", "adjclose", "dividends"]
TECHNICAL_INDICATORS = ["RSI", "MACD", "MACD_Signal", "MACD_Diff", "BB_High", "BB_Low", "BB_Middle"]
FEATURE_COLUMNS = BASE_FEATURES + TECHNICAL_INDICATORS

# Sequence length the model was trained on
TARGET_LENGTH = 60


def _load_model():
    global _model
    if _model is None:
        import tf_keras
        from app.ml.transformer import (
            StockPredictionTransformer,
            lower_bound_loss,
            upper_bound_loss,
            expected_value_loss,
            confidence_loss,
        )
        _model = tf_keras.models.load_model(
            _MODEL_PATH,
            custom_objects={
                "StockPredictionTransformer": StockPredictionTransformer,
                "lower_bound_loss": lower_bound_loss,
                "upper_bound_loss": upper_bound_loss,
                "expected_value_loss": expected_value_loss,
                "confidence_loss": confidence_loss,
            },
            compile=False,  # skip optimizer deserialization — inference only
        )
    return _model


def _preprocess(df: pd.DataFrame):
    """Preprocess a DataFrame into the 4-input format expected by the model."""
    df = df.copy()

    # Fill missing columns with 0
    for col in FEATURE_COLUMNS:
        if col not in df.columns:
            df[col] = 0.0

    # Build mask (1 = real value, 0 = was NaN)
    mask_df = pd.DataFrame({col: df[col].notna().astype(float) for col in FEATURE_COLUMNS})

    # Fill NaN with column mean
    fill_values = {col: df[col].dropna().mean() for col in FEATURE_COLUMNS}
    for col in FEATURE_COLUMNS:
        df[col] = df[col].fillna(fill_values[col])

    # Normalize per-column
    scalers: dict[str, StandardScaler] = {}
    df_norm = df.copy()
    for col in FEATURE_COLUMNS:
        scaler = StandardScaler()
        scaler.fit(df[col].values.reshape(-1, 1))
        df_norm[col] = scaler.transform(df[col].values.reshape(-1, 1)).flatten()
        scalers[col] = scaler

    # Build feature matrix: [value, mask] interleaved columns
    feature_cols = []
    for col in FEATURE_COLUMNS:
        feature_cols.append(df_norm[col].values)
        feature_cols.append(mask_df[col].values)
    feature_matrix = np.column_stack(feature_cols)  # (T, 28)
    mask_matrix = mask_df.values                     # (T, 14)

    # Take the last TARGET_LENGTH rows as the inference window
    T = feature_matrix.shape[0]
    if T >= TARGET_LENGTH:
        feat_seq = feature_matrix[-TARGET_LENGTH:]
        mask_seq = mask_matrix[-TARGET_LENGTH:]
        attn_mask = np.ones(TARGET_LENGTH)
    else:
        pad_len = TARGET_LENGTH - T
        feat_seq = np.vstack([np.zeros((pad_len, feature_matrix.shape[1])), feature_matrix])
        mask_seq = np.vstack([np.zeros((pad_len, mask_matrix.shape[1])), mask_matrix])
        attn_mask = np.array([0.0] * pad_len + [1.0] * T)

    # Data quality score = mean of valid feature ratio over real positions
    real_positions = attn_mask == 1
    data_quality = float(mask_seq[real_positions].mean()) if real_positions.sum() > 0 else 0.0

    X_features = feat_seq[np.newaxis]         # (1, 60, 28)
    X_masks = mask_seq[np.newaxis]            # (1, 60, 14)
    X_attention = attn_mask[np.newaxis]       # (1, 60)
    X_quality = np.array([data_quality])      # (1,)  — model expand_dims this to (1,1)

    return X_features, X_masks, X_attention, X_quality, scalers


def predict(df: pd.DataFrame) -> dict:
    """
    Run inference on a stock DataFrame.

    Returns a dict with keys:
      lower_bound, upper_bound, expected_value, confidence
    All values are in the original (un-normalized) price scale.
    """
    X_features, X_masks, X_attention, X_quality, scalers = _preprocess(df)

    model = _load_model()
    preds = model.predict([X_features, X_masks, X_attention, X_quality], verbose=0)

    close_scaler = scalers["close"]

    def _denorm(val: float) -> float:
        return float(close_scaler.inverse_transform([[val]])[0][0])

    return {
        "lower_bound": _denorm(float(preds["lower_bound"][0][0])),
        "upper_bound": _denorm(float(preds["upper_bound"][0][0])),
        "expected_value": _denorm(float(preds["expected_value"][0][0])),
        "confidence": float(preds["confidence"][0][0]),
    }
