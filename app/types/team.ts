export interface TeamStaff {
  id: string
  teamId: string
  role: string // "leader" | "coach"
  name: string
  phone?: string
  email?: string
  address?: string
  lineId?: string
  createdAt: string
  updatedAt: string
  team?: {
    id: string
    name: string
    userId: string
  }
}

export interface CreateTeamStaffRequest {
  teamId: string
  role: string
  name: string
  phone?: string
  email?: string
  address?: string
  lineId?: string
}

export interface UpdateTeamStaffRequest {
  role?: string
  name?: string
  phone?: string
  email?: string
  address?: string
  lineId?: string
}

export interface UserPlayer {
  id: string
  userId: string
  name: string
  gender: "M" | "F"
  birthday: string
  isBanned: boolean
  banReason?: string
  banUntil?: string
  createdAt: string
  updatedAt: string
  user?: {
    id: string
    name: string
    email: string
  }
  _count?: {
    registration_participant: number
  }
}

export interface CreateUserPlayerRequest {
  name: string
  gender: "M" | "F"
  birthday: string
}

export interface UpdateUserPlayerRequest {
  name?: string
  gender?: "M" | "F"
  birthday?: string
  isBanned?: boolean
  banReason?: string
  banUntil?: string
}
