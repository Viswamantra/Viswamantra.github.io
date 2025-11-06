#!/usr/bin/env python3
"""
Test script for push notification functionality
"""
import asyncio
import aiohttp
from typing import List

async def send_push_notification(push_tokens: List[str], title: str, body: str, data: dict = None):
    """Send push notification via Expo Push API"""
    
    if not push_tokens:
        return {"success": False, "message": "No push tokens provided"}
    
    messages = []
    for token in push_tokens:
        if token and token.startswith("ExponentPushToken["):
            message = {
                "to": token,
                "sound": "default",
                "title": title,
                "body": body,
                "data": data or {}
            }
            messages.append(message)
    
    if not messages:
        return {"success": False, "message": "No valid push tokens"}
    
    try:
        async with aiohttp.ClientSession() as session:
            async with session.post(
                "https://exp.host/--/api/v2/push/send",
                json=messages,
                headers={"Content-Type": "application/json"}
            ) as response:
                result = await response.json()
                print(f"✅ Push notification sent to {len(messages)} devices")
                return {"success": True, "result": result}
    except Exception as e:
        print(f"❌ Push notification failed: {e}")
        return {"success": False, "error": str(e)}

async def test_push_notifications():
    """Test push notification functionality"""
    print("🧪 Testing Push Notification Function...")
    
    # Test with empty tokens
    result1 = await send_push_notification([], "Test", "Test message")
    print(f"Empty tokens test: {result1}")
    
    # Test with invalid tokens
    result2 = await send_push_notification(["invalid_token"], "Test", "Test message")
    print(f"Invalid tokens test: {result2}")
    
    # Test with valid format token (will fail at API level since it's fake)
    fake_token = "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]"
    result3 = await send_push_notification([fake_token], "Test Offer", "20% OFF at Test Restaurant!", {
        "type": "new_offer",
        "offer_id": "test123",
        "business_id": "business123"
    })
    print(f"Valid format token test: {result3}")
    
    print("✅ Push notification tests completed!")

if __name__ == "__main__":
    asyncio.run(test_push_notifications())