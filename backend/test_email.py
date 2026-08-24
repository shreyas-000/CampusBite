import asyncio
from services.email import send_magic_link_email

async def main():
    print("Sending test magic link email...")
    await send_magic_link_email("cipheroot00@gmail.com", "test-verification-token-12345")
    print("Done!")

if __name__ == "__main__":
    asyncio.run(main())
