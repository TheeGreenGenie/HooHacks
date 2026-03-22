"""
Solana payment — real implementation using solders.

Platform wallet is loaded from SOLANA_PRIVATE_KEY (base58-encoded 64-byte keypair).
send_sol() sends SOL from the platform wallet to a recipient address.
get_platform_address() returns the platform's public key so users can pay into it.
"""
from __future__ import annotations

import base64

import httpx

from app.core.config import settings


def _load_keypair():
    """Load the platform Solana keypair from SOLANA_PRIVATE_KEY (base58)."""
    from solders.keypair import Keypair  # type: ignore
    pk = settings.SOLANA_PRIVATE_KEY
    if not pk:
        raise RuntimeError("SOLANA_PRIVATE_KEY not set")
    return Keypair.from_base58_string(pk)


def get_platform_address() -> str:
    """Return the platform's Solana wallet address (public key)."""
    try:
        kp = _load_keypair()
        return str(kp.pubkey())
    except Exception as exc:
        return f"[Unavailable: {exc}]"


def get_balance(pubkey: str | None = None) -> dict:
    """Return SOL balance for a given public key (or the platform wallet)."""
    try:
        address = pubkey or get_platform_address()
        rpc = settings.SOLANA_RPC_URL or "https://api.mainnet-beta.solana.com"
        resp = httpx.post(
            rpc,
            json={"jsonrpc": "2.0", "id": 1, "method": "getBalance", "params": [address]},
            timeout=10,
        )
        resp.raise_for_status()
        lamports = resp.json().get("result", {}).get("value", 0)
        return {"status": "ok", "pubkey": address, "balance_sol": lamports / 1_000_000_000}
    except Exception as exc:
        return {"status": "error", "pubkey": pubkey, "balance_sol": 0.0, "error": str(exc)}


def send_sol(recipient_pubkey: str, amount_sol: float, memo: str = "") -> dict:
    """
    Send SOL from the platform wallet to recipient_pubkey.

    Returns a dict with status and transaction signature on success.
    Falls back to stub when ENABLE_PAYMENTS=false.
    """
    if not settings.ENABLE_PAYMENTS:
        platform_addr = get_platform_address()
        return {
            "status": "simulation",
            "message": (
                f"Payments disabled (ENABLE_PAYMENTS=false). "
                f"To pay with Solana, send {amount_sol:.6f} SOL to {platform_addr}."
            ),
            "platform_wallet": platform_addr,
            "recipient": recipient_pubkey,
            "amount_sol": amount_sol,
        }

    try:
        from solders.keypair import Keypair  # type: ignore
        from solders.pubkey import Pubkey  # type: ignore
        from solders.system_program import TransferParams, transfer  # type: ignore
        from solders.transaction import Transaction  # type: ignore
        from solders.message import Message  # type: ignore
        from solders.hash import Hash  # type: ignore

        kp = _load_keypair()
        rpc = settings.SOLANA_RPC_URL or "https://api.mainnet-beta.solana.com"
        lamports = int(amount_sol * 1_000_000_000)

        with httpx.Client(timeout=15) as client:
            # 1. Get latest blockhash
            bh_resp = client.post(rpc, json={
                "jsonrpc": "2.0", "id": 1,
                "method": "getLatestBlockhash",
                "params": [{"commitment": "finalized"}],
            })
            bh_resp.raise_for_status()
            blockhash_str = bh_resp.json()["result"]["value"]["blockhash"]
            recent_blockhash = Hash.from_string(blockhash_str)

            # 2. Build transfer instruction
            recipient = Pubkey.from_string(recipient_pubkey)
            ix = transfer(TransferParams(
                from_pubkey=kp.pubkey(),
                to_pubkey=recipient,
                lamports=lamports,
            ))

            # 3. Build + sign transaction
            msg = Message.new_with_blockhash([ix], kp.pubkey(), recent_blockhash)
            tx = Transaction([kp], msg, recent_blockhash)

            # 4. Send
            tx_bytes = base64.b64encode(bytes(tx)).decode()
            send_resp = client.post(rpc, json={
                "jsonrpc": "2.0", "id": 1,
                "method": "sendTransaction",
                "params": [tx_bytes, {"encoding": "base64", "preflightCommitment": "finalized"}],
            })
            send_resp.raise_for_status()
            result = send_resp.json()

            if "error" in result:
                raise RuntimeError(result["error"].get("message", "Unknown RPC error"))

            signature = result["result"]
            return {
                "status": "ok",
                "signature": signature,
                "recipient": recipient_pubkey,
                "amount_sol": amount_sol,
                "explorer": f"https://explorer.solana.com/tx/{signature}",
            }

    except Exception as exc:
        return {"status": "error", "error": str(exc), "recipient": recipient_pubkey, "amount_sol": amount_sol}
