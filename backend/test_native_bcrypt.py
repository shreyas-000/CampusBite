import bcrypt

def hash_password(password: str) -> str:
    pwd_bytes = password.encode('utf-8')
    if len(pwd_bytes) > 72:
        pwd_bytes = pwd_bytes[:72]
    # bcrypt.gensalt() generates a random salt.
    # bcrypt.hashpw takes (password, salt)
    hashed = bcrypt.hashpw(pwd_bytes, bcrypt.gensalt())
    return hashed.decode('utf-8')

def verify_password(plain: str, hashed: str) -> bool:
    plain_bytes = plain.encode('utf-8')
    if len(plain_bytes) > 72:
        plain_bytes = plain_bytes[:72]
    
    hashed_bytes = hashed.encode('utf-8')
    try:
        return bcrypt.checkpw(plain_bytes, hashed_bytes)
    except ValueError:
        return False

# Test it
password = "my_secret_password"
hashed = hash_password(password)
print(f"Hashed: {hashed}")
print(f"Verify valid: {verify_password(password, hashed)}")
print(f"Verify invalid: {verify_password('wrong', hashed)}")
