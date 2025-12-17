export interface Student {
  id: string;
  name: string;
  address: string;
  schoolId: string; // Linking to a destination
  guardianContact: string;
  notes?: string;
  geo?: {
    lat: number;
    lng: number;
  };
}

export interface School {
  id: string;
  name: string;
  address: string;
  phone: string;
}

export interface RoutePlan {
  id: string;
  type: 'MORNING_PICKUP' | 'AFTERNOON_DROPOFF';
  date: string; // ISO date string
  stops: RouteStop[];
  status: 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED';
}

export interface RouteStop {
  id: string; // could be student ID or school ID
  studentId?: string; // undefined if it's the school
  isSchool: boolean;
  address: string;
  name: string;
  order: number;
  status: 'PENDING' | 'COMPLETED' | 'SKIPPED';
  isPresent: boolean; // "O Pulo do Gato" - Attendance
}

// Mapped from Google Maps Directions API Response
export interface NavigationState {
  currentPolyline: { x: number; y: number }[]; // Decoded points for drawing
  distance: string; // e.g., "2.5 km"
  duration: string; // e.g., "15 min"
  nextManeuver: string; // e.g., "Vire à direita"
  nextStreet: string; // e.g., "na Av. Paulista"
  stepDistance: string; // e.g., "300m"
}

export interface NavigationLeg {
  polyline: { x: number; y: number }[];
  distance: string;
  duration: string;
  instruction: string;
}

export enum ViewState {
  SCHOOL_LIST = 'SCHOOL_LIST',       // Level 1: Select School
  SCHOOL_DASHBOARD = 'SCHOOL_DASHBOARD', // Level 2: Menu for specific school
  STUDENTS = 'STUDENTS',             // Level 2a: Manage Students
  ROUTES = 'ROUTES',                 // Level 2b: Plan Route
  ACTIVE_ROUTE = 'ACTIVE_ROUTE'      // Level 3: Navigation
}