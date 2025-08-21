/**
 * Game entity type definition
 */
export interface GameCategory {
  id: string
  gameId: string
  categoryName: string
  conditions?: string | null
  createdAt: string
  updatedAt: string
}

export interface GameFee {
  id: string
  gameId: string
  categoryId?: string | null
  feeType: string
  description: string
  amount: number
  isRequired: boolean
  note?: string | null
  createdAt: string
  updatedAt: string
}

export interface Game {
  id: string | number
  name: string
  region: string
  venue: string
  address: string
  signupStart: string
  signupEnd: string
  gameStart: string
  gameEnd: string
  createdAt: string
  updatedAt: string
  game_category?: GameCategory[]
  game_fee?: GameFee[]
}

/**
 * Team member entity type definition
 */
export interface TeamMember {
  id: string
  teamId: string
  name: string
  role: string
  gender: string
  birthday: string | undefined
  isBanned: boolean
  banReason?: string
  banUntil?: string
  phone?: string
  email?: string
  createdAt: string
  updatedAt: string
}

/**
 * Team entity type definition
 */
export interface Team {
  id: string
  name: string
  userId: string
  createdAt: string
  updatedAt: string
  user?: {
    id: string
    name: string
    email: string
  }
  team_member: TeamMember[]
  registration?: any[]
  _count: {
    team_member: number
    registration: number
  }
}

/**
 * Game status type
 */
export type GameStatus =
  | "upcoming"
  | "registration"
  | "closed"
  | "ongoing"
  | "ended"

/**
 * Badge color type for game status
 */
export type GameStatusColor =
  | "primary"
  | "success"
  | "warning"
  | "info"
  | "neutral"
  | "error"
  | "secondary"
