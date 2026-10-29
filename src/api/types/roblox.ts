export interface RobloxUserSocialNetworkProfiles {
    facebook: string
    twitter: string
    youtube: string
    twitch: string
    guilded: string
    visibility: string
}

export interface RobloxUser {
    path: string
    createTime: string
    id: string
    name: string
    displayName: string
    about: string
    locale: string
    premium: boolean
    idVerified: boolean
    socialNetworkProfiles: RobloxUserSocialNetworkProfiles
}

export interface GenerateThumbnailOptions {
    size?: number
    format?: string
    shape?: string
}

export interface GenerateThumbnailOperationError {
    code: number
    message: string
    details: string[]
}

export interface GenerateThumbnailOperationResponse {
    "@type": string
    imageUri: string
}

export interface GenerateThumbnailOperation {
    path: string
    metadata: Record<string, string>
    done: boolean
    error: GenerateThumbnailOperationError
    response: GenerateThumbnailOperationResponse
}