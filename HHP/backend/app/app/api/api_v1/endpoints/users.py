from typing import Any, List

from fastapi import APIRouter, Body, Depends, HTTPException
from fastapi.encoders import jsonable_encoder
from pydantic.networks import EmailStr
from motor.core import AgnosticDatabase
from odmantic import AIOEngine

from app import crud, models, schemas
from app.api import deps
from app.core.config import settings
from app.core import security
from app.core.deps import UserContext, get_user_ctx
from app.crud.crud_profile import get_or_create_profile, update_profile
from app.db.session import get_engine
from app.schemas.profile import UserProfile
from app.utilities import (
    send_new_account_email,
)

router = APIRouter()


@router.post("/", response_model=schemas.User)
async def create_user_profile(
    *,
    db: AgnosticDatabase = Depends(deps.get_db),
    password: str = Body(...),
    email: EmailStr = Body(...),
    full_name: str = Body(""),
) -> Any:
    """
    Create new user without the need to be logged in.
    """
    user = await crud.user.get_by_email(db, email=email)
    if user:
        raise HTTPException(
            status_code=400,
            detail="This username is not available.",
        )
    # Create user auth
    user_in = schemas.UserCreate(password=password, email=email, full_name=full_name)
    user = await crud.user.create(db, obj_in=user_in)
    return user


@router.put("/", response_model=schemas.User)
async def update_user(
    *,
    db: AgnosticDatabase = Depends(deps.get_db),
    obj_in: schemas.UserUpdate,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Update user.
    """
    if current_user.hashed_password:
        user = await crud.user.authenticate(db, email=current_user.email, password=obj_in.original)
        if not obj_in.original or not user:
            raise HTTPException(status_code=400, detail="Unable to authenticate this update.")
    current_user_data = jsonable_encoder(current_user)
    user_in = schemas.UserUpdate(**current_user_data)
    if obj_in.password is not None:
        user_in.password = obj_in.password
    if obj_in.full_name is not None:
        user_in.full_name = obj_in.full_name
    if obj_in.email is not None:
        check_user = await crud.user.get_by_email(db, email=obj_in.email)
        if check_user and check_user.email != current_user.email:
            raise HTTPException(
                status_code=400,
                detail="This username is not available.",
            )
        user_in.email = obj_in.email
    user = await crud.user.update(db, db_obj=current_user, obj_in=user_in)
    return user


@router.get("/", response_model=schemas.User)
async def read_user(
    *,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Get current user.
    """
    return current_user


@router.get("/all", response_model=List[schemas.User])
async def read_all_users(
    *,
    db: AgnosticDatabase = Depends(deps.get_db),
    page: int = 0,
    current_user: models.User = Depends(deps.get_current_active_superuser),
) -> Any:
    """
    Retrieve all current users.
    """
    return await crud.user.get_multi(db=db, page=page)


@router.post("/new-totp", response_model=schemas.NewTOTP)
async def request_new_totp(
    *,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Request new keys to enable TOTP on the user account.
    """
    obj_in = security.create_new_totp(label=current_user.email)
    # Remove the secret ...
    obj_in.secret = None
    return obj_in


@router.post("/toggle-state", response_model=schemas.Msg)
async def toggle_state(
    *,
    db: AgnosticDatabase = Depends(deps.get_db),
    user_in: schemas.UserUpdate,
    current_user: models.User = Depends(deps.get_current_active_superuser),
) -> Any:
    """
    Toggle user state (moderator function)
    """
    response = await crud.user.toggle_user_state(db=db, obj_in=user_in)
    if not response:
        raise HTTPException(
            status_code=400,
            detail="Invalid request.",
        )
    return {"msg": "User state toggled successfully."}


@router.post("/create", response_model=schemas.User)
async def create_user(
    *,
    db: AgnosticDatabase = Depends(deps.get_db),
    user_in: schemas.UserCreate,
    current_user: models.User = Depends(deps.get_current_active_superuser),
) -> Any:
    """
    Create new user (moderator function).
    """
    user = await crud.user.get_by_email(db, email=user_in.email)
    if user:
        raise HTTPException(
            status_code=400,
            detail="The user with this username already exists in the system.",
        )
    user = await crud.user.create(db, obj_in=user_in)
    if settings.EMAILS_ENABLED and user_in.email:
        send_new_account_email(email_to=user_in.email, username=user_in.email, password=user_in.password)
    return user


@router.get("/tester", response_model=schemas.Msg)
async def test_endpoint() -> Any:
    """
    Test current endpoint.
    """
    return {"msg": "Message returned ok."}


@router.get("/me/profile", response_model=UserProfile)
async def get_my_profile(
    ctx: UserContext = Depends(get_user_ctx),
    engine: AIOEngine = Depends(get_engine),
) -> Any:
    """
    Return the Auth0-linked MongoDB profile for the currently logged-in user.
    Creates the profile document if this is the first request from this user.
    Returns 404 for anonymous (unauthenticated) requests.
    """
    if ctx.sub == "anonymous":
        raise HTTPException(status_code=404, detail="No profile — not authenticated")
    profile = ctx.profile or await get_or_create_profile(engine, ctx.sub)
    return UserProfile(
        auth0_sub=profile.auth0_sub,
        full_name=profile.full_name,
        age=profile.age,
        phone_number=profile.phone_number,
        display_name=profile.display_name,
        income_bracket=profile.income_bracket,
        spending_habits=profile.spending_habits,
        savings_goal=profile.savings_goal,
        risk_tolerance=profile.risk_tolerance,
        gemini_profile=profile.gemini_profile,
    )


@router.patch("/me/profile", response_model=UserProfile)
async def update_my_profile(
    data: UserProfile,
    ctx: UserContext = Depends(get_user_ctx),
    engine: AIOEngine = Depends(get_engine),
) -> Any:
    """
    Update fields on the current user's MongoDB profile.
    Only non-null fields in the request body are applied.
    """
    if ctx.sub == "anonymous":
        raise HTTPException(status_code=401, detail="Authentication required")
    updated = await update_profile(engine, ctx.sub, data)
    return UserProfile(
        auth0_sub=updated.auth0_sub,
        display_name=updated.display_name,
        income_bracket=updated.income_bracket,
        spending_habits=updated.spending_habits,
        savings_goal=updated.savings_goal,
        risk_tolerance=updated.risk_tolerance,
        gemini_profile=updated.gemini_profile,
    )
