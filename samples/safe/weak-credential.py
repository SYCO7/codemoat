import secrets


def create_admin_user():
    return User(
        username="admin",
        password=secrets.token_urlsafe(32),
    )
