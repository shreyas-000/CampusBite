import bcrypt
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

password = "my_secret_password"
passlib_hash = pwd_context.hash(password)

print(f"Passlib hash: {passlib_hash}")

# Check with bcrypt directly
password_bytes = password.encode('utf-8')
hash_bytes = passlib_hash.encode('utf-8')

try:
    is_valid = bcrypt.checkpw(password_bytes, hash_bytes)
    print(f"bcrypt directly checking passlib hash: {is_valid}")
except Exception as e:
    print(f"Error checking: {e}")

