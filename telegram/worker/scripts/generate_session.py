#!/usr/bin/env python3
"""
Generate Telethon session string for ITAM Telegram Worker.

This script needs to be run ONCE locally to generate a session string.
The session string is then stored in TG_SESSION_STRING environment variable.

Usage:
    python scripts/generate_session.py

You will need:
1. Telegram API ID (from https://my.telegram.org/apps)
2. Telegram API Hash (from https://my.telegram.org/apps)
3. Your phone number (with country code, e.g., +79001234567)
4. Verification code from Telegram

The script will output a session string that you should copy to your .env file.
"""

import asyncio
import sys

try:
    from telethon import TelegramClient
    from telethon.sessions import StringSession
except ImportError:
    print("Error: telethon is not installed.")
    print("Install it with: pip install telethon")
    sys.exit(1)


async def generate_session():
    """Interactive session string generator."""
    
    print("=" * 60)
    print("ITAM Telegram Session Generator")
    print("=" * 60)
    print()
    print("This script will help you generate a session string for the")
    print("Telegram stats collector. You need to run this ONCE.")
    print()
    print("You'll need:")
    print("  1. API ID and API Hash from https://my.telegram.org/apps")
    print("  2. Your phone number")
    print("  3. Verification code from Telegram")
    print()
    
    # Get credentials
    try:
        api_id_str = input("Enter API ID: ").strip()
        api_id = int(api_id_str)
    except ValueError:
        print("Error: API ID must be a number")
        return
    
    api_hash = input("Enter API Hash: ").strip()
    if not api_hash:
        print("Error: API Hash is required")
        return
    
    print()
    print("Connecting to Telegram...")
    
    # Create client with empty string session
    client = TelegramClient(StringSession(), api_id, api_hash)
    
    await client.connect()
    
    if not await client.is_user_authorized():
        print()
        phone = input("Enter your phone number (with country code, e.g., +79001234567): ").strip()
        
        await client.send_code_request(phone)
        
        print()
        print("A verification code has been sent to your Telegram app.")
        code = input("Enter the verification code: ").strip()
        
        try:
            await client.sign_in(phone, code)
        except Exception as e:
            if "Two-step verification" in str(e) or "password" in str(e).lower():
                print()
                password = input("Two-factor authentication is enabled. Enter your password: ").strip()
                await client.sign_in(password=password)
            else:
                raise
    
    # Get session string
    session_string = client.session.save()
    
    # Verify connection
    me = await client.get_me()
    print()
    print(f"✅ Successfully authenticated as: {me.first_name} (@{me.username})")
    print()
    
    # Test channel access
    print("Testing channel access...")
    try:
        channel = await client.get_entity("itatmisis")
        print(f"✅ Can access channel: {channel.title}")
    except Exception as e:
        print(f"⚠️  Cannot access @itatmisis channel: {e}")
        print("   Make sure your account is subscribed to the channel.")
    
    print()
    print("=" * 60)
    print("YOUR SESSION STRING (copy this to .env file):")
    print("=" * 60)
    print()
    print(f"TG_SESSION_STRING={session_string}")
    print()
    print("=" * 60)
    print()
    print("⚠️  IMPORTANT:")
    print("   - Keep this session string SECRET")
    print("   - Do NOT commit it to git")
    print("   - Anyone with this string can access your Telegram account")
    print()
    
    await client.disconnect()


def main():
    """Entry point."""
    try:
        asyncio.run(generate_session())
    except KeyboardInterrupt:
        print("\nCancelled by user")
    except Exception as e:
        print(f"\nError: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
