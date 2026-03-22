"""
StockPredictionTransformer — Keras model definition.

Kept separate from stock_predictor.py so it can be imported as a
custom_object when loading the saved .keras file.
"""
from __future__ import annotations

import tensorflow as tf
import tf_keras


class StockPredictionTransformer(tf_keras.Model):
    def __init__(
        self,
        d_model: int = 256,
        num_heads: int = 8,
        num_layers: int = 6,
        dff: int = 1024,
        input_features: int = 28,
        dropout_rate: float = 0.1,
    ):
        super().__init__()
        self.d_model = d_model
        self.num_heads = num_heads
        self.num_layers = num_layers

        self.input_projection = tf_keras.layers.Dense(d_model, activation="relu")
        self.dropout = tf_keras.layers.Dropout(dropout_rate)
        self.pos_embedding = tf_keras.layers.Embedding(60, d_model)
        self.global_pool = tf_keras.layers.GlobalAveragePooling1D()

        self.lower_bound_head = tf_keras.layers.Dense(1, name="lower_bound")
        self.upper_bound_head = tf_keras.layers.Dense(1, name="upper_bound")
        self.expected_value_head = tf_keras.layers.Dense(1, name="expected_value")
        self.confidence_head = tf_keras.Sequential(
            [
                tf_keras.layers.Dense(64, activation="relu"),
                tf_keras.layers.Dense(1, activation="sigmoid", name="confidence"),
            ]
        )

        self.attention_layers = []
        self.ffn_layers = []
        self.layernorm1_layers = []
        self.layernorm2_layers = []
        self.dropout1_layers = []
        self.dropout2_layers = []

        for _ in range(num_layers):
            self.attention_layers.append(
                tf_keras.layers.MultiHeadAttention(
                    num_heads=num_heads,
                    key_dim=d_model // num_heads,
                    dropout=dropout_rate,
                )
            )
            self.ffn_layers.append(
                tf_keras.Sequential(
                    [
                        tf_keras.layers.Dense(dff, activation="relu"),
                        tf_keras.layers.Dense(d_model),
                    ]
                )
            )
            self.layernorm1_layers.append(tf_keras.layers.LayerNormalization())
            self.layernorm2_layers.append(tf_keras.layers.LayerNormalization())
            self.dropout1_layers.append(tf_keras.layers.Dropout(dropout_rate))
            self.dropout2_layers.append(tf_keras.layers.Dropout(dropout_rate))

    def call(self, inputs, training=None):
        features, masks, attention_mask, data_quality = inputs
        combined_input = tf.concat([features, masks], axis=-1)

        x = self.input_projection(combined_input)

        seq_len = tf.shape(x)[1]
        positions = tf.range(seq_len)
        pos_encoding = self.pos_embedding(positions)
        x += pos_encoding
        x = self.dropout(x, training=training)

        extended_attention_mask = attention_mask[:, tf.newaxis, tf.newaxis, :]
        extended_attention_mask = (1.0 - extended_attention_mask) * -1e9

        for i in range(self.num_layers):
            attn_output = self.attention_layers[i](
                query=x,
                value=x,
                key=x,
                attention_mask=extended_attention_mask,
                training=training,
            )
            attn_output = self.dropout1_layers[i](attn_output, training=training)
            x1 = self.layernorm1_layers[i](x + attn_output)
            ffn_output = self.ffn_layers[i](x1)
            ffn_output = self.dropout2_layers[i](ffn_output, training=training)
            x = self.layernorm2_layers[i](x1 + ffn_output)

        masked_x = x * attention_mask[:, :, tf.newaxis]
        sequence_sum = tf.reduce_sum(masked_x, axis=1)
        sequence_length = tf.reduce_sum(attention_mask, axis=1, keepdims=True)
        sequence_representation = sequence_sum / tf.maximum(sequence_length, 1.0)

        lower_bound = self.lower_bound_head(sequence_representation)
        upper_bound = self.upper_bound_head(sequence_representation)
        expected_value = self.expected_value_head(sequence_representation)

        confidence_input = tf.concat(
            [sequence_representation, tf.expand_dims(data_quality, -1)], axis=-1
        )
        confidence = self.confidence_head(confidence_input)

        return {
            "lower_bound": lower_bound,
            "upper_bound": upper_bound,
            "expected_value": expected_value,
            "confidence": confidence,
        }

    def get_config(self):
        return {
            "d_model": self.d_model,
            "num_heads": self.num_heads,
            "num_layers": self.num_layers,
            "dff": self.d_model * 4,
            "dropout_rate": 0.1,
        }


def quantile_loss(y_true, y_pred, quantile):
    error = y_true - y_pred
    return tf.reduce_mean(tf.maximum(quantile * error, (quantile - 1) * error))


def lower_bound_loss(y_true, y_pred):
    return quantile_loss(y_true, y_pred, 0.1)


def upper_bound_loss(y_true, y_pred):
    return quantile_loss(y_true, y_pred, 0.9)


def expected_value_loss(y_true, y_pred):
    return quantile_loss(y_true, y_pred, 0.5)


def confidence_loss(y_true, y_pred):
    return tf_keras.losses.mean_squared_error(y_true, y_pred)
