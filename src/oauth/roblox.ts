import crypto from 'crypto';
import jwt from "jsonwebtoken";

interface StateToken {
    userid: string
}

function generateStateJWT(data: StateToken, secret: string): string {
    return jwt.sign(data, secret, {expiresIn: 300})
}

function verifyStateJWT(state: string, secret: string): StateToken {
    return jwt.verify(state, secret) as StateToken;
}

function generateAuthorizationURL(userid: string, env: Env): string {
    let state = generateStateJWT({userid: userid}, env.JWT_SECRET);
    return `${env.ROBLOX_BASE_API_URI}/authorize?client_id=${env.ROBLOX_CLIENT_ID}&redirect_uri=${env.ROBLOX_REDIRECT_URI}&scope=openid profile&response_type=code&state=${state}`
}

interface ObtainTokenResponse {
    access_token: string
    refresh_token: string
    token_type: string
    expires_in: number
    scope: string
}

async function exchangeCodeForToken(code: string, env: Env): Promise<ObtainTokenResponse> {
    let response = await fetch(
        env.ROBLOX_BASE_API_URI + "/token",
        {
            method: "POST",
            body: new URLSearchParams({code: code, grant_type: "authorization_code", client_id: env.ROBLOX_CLIENT_ID, client_secret: env.ROBLOX_CLIENT_SECRET})
        }
    )
    return await response.json() as ObtainTokenResponse
}

async function exchangeRefreshToken(refresh_token: string, env: Env): Promise<ObtainTokenResponse> {
    let response = await fetch(
        env.ROBLOX_BASE_API_URI + "/token",
        {
            method: "POST",
            body: new URLSearchParams({refresh_token: refresh_token, grant_type: "refresh_token", client_id: env.ROBLOX_CLIENT_ID, client_secret: env.ROBLOX_CLIENT_SECRET})
        }
    )
    return await response.json() as ObtainTokenResponse
}

interface RobloxUserInfo {
    sub: string
    name: string
    nickname: string
    preferred_username: string
    created_at: number
    profile: string
    piucture: string | null
}

async function getUserInfo(token: string, env: Env): Promise<RobloxUserInfo> {
    let response = await fetch(
        env.ROBLOX_BASE_API_URI + "/userinfo",
        {
            headers: {Authorization: "Bearer " + token}
        }
    )
    return await response.json() as RobloxUserInfo
}