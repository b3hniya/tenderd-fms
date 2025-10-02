/**
 * Route generation and GPS simulation utilities
 */

import { lerp } from './physics.js';

/**
 * Waypoint on a route
 */
export interface Waypoint {
  lat: number;
  lng: number;
  targetSpeed: number; // km/h
}

/**
 * Route configuration
 */
export interface Route {
  name: string;
  waypoints: Waypoint[];
  loop: boolean;
}

/**
 * Dubai City Route (circular route around downtown)
 */
export const DUBAI_CITY_ROUTE: Route = {
  name: 'Dubai City Loop',
  loop: true,
  waypoints: [
    { lat: 25.2048, lng: 55.2708, targetSpeed: 60 }, // Starting point near Dubai Mall
    { lat: 25.2148, lng: 55.2808, targetSpeed: 70 }, // North
    { lat: 25.2248, lng: 55.2908, targetSpeed: 80 }, // North-East
    { lat: 25.2348, lng: 55.2808, targetSpeed: 70 }, // East
    { lat: 25.2248, lng: 55.2708, targetSpeed: 60 }, // South-East
    { lat: 25.2148, lng: 55.2608, targetSpeed: 65 }, // South
    { lat: 25.2048, lng: 55.2608, targetSpeed: 60 }, // South-West
    { lat: 25.1948, lng: 55.2708, targetSpeed: 70 }, // West
  ],
};

/**
 * Dubai to Abu Dhabi Highway Route
 */
export const DUBAI_ABU_DHABI_HIGHWAY: Route = {
  name: 'Dubai-Abu Dhabi Highway',
  loop: true,
  waypoints: [
    { lat: 25.2048, lng: 55.2708, targetSpeed: 80 }, // Dubai start
    { lat: 25.1048, lng: 55.1708, targetSpeed: 120 }, // Highway speed
    { lat: 25.0048, lng: 55.0708, targetSpeed: 120 }, // Highway speed
    { lat: 24.9048, lng: 54.9708, targetSpeed: 110 }, // Highway speed
    { lat: 24.8048, lng: 54.8708, targetSpeed: 100 }, // Approaching Abu Dhabi
    { lat: 24.7048, lng: 54.7708, targetSpeed: 80 }, // Abu Dhabi outskirts
    { lat: 24.4539, lng: 54.3773, targetSpeed: 60 }, // Abu Dhabi city
    // Return journey
    { lat: 24.5539, lng: 54.4773, targetSpeed: 80 }, // Leaving city
    { lat: 24.7048, lng: 54.7708, targetSpeed: 100 }, // Highway
    { lat: 24.9048, lng: 54.9708, targetSpeed: 120 }, // Highway
    { lat: 25.0048, lng: 55.0708, targetSpeed: 120 }, // Highway
    { lat: 25.1048, lng: 55.1708, targetSpeed: 110 }, // Approaching Dubai
  ],
};

/**
 * Industrial Area Route (slower, more stops)
 */
export const INDUSTRIAL_ROUTE: Route = {
  name: 'Industrial Area',
  loop: true,
  waypoints: [
    { lat: 25.1048, lng: 55.1708, targetSpeed: 40 },
    { lat: 25.1148, lng: 55.1808, targetSpeed: 30 },
    { lat: 25.1248, lng: 55.1908, targetSpeed: 50 },
    { lat: 25.1348, lng: 55.1808, targetSpeed: 35 },
    { lat: 25.1248, lng: 55.1708, targetSpeed: 45 },
    { lat: 25.1148, lng: 55.1608, targetSpeed: 40 },
  ],
};

/**
 * All available routes
 */
export const ROUTES: Route[] = [DUBAI_CITY_ROUTE, DUBAI_ABU_DHABI_HIGHWAY, INDUSTRIAL_ROUTE];

/**
 * Get a route by index (wraps around if index is out of bounds)
 */
export function getRoute(index: number): Route {
  return ROUTES[index % ROUTES.length];
}

/**
 * Position along a route
 */
export interface RoutePosition {
  lat: number;
  lng: number;
  targetSpeed: number;
  waypointIndex: number;
  progress: number; // 0-1 between current and next waypoint
}

/**
 * Calculate next position along a route based on speed and time
 *
 * @param route The route to follow
 * @param currentPosition Current position on the route
 * @param speed Current speed in km/h
 * @param deltaTime Time elapsed in milliseconds
 * @returns New position on the route
 */
export function getNextPosition(
  route: Route,
  currentPosition: RoutePosition,
  speed: number,
  deltaTime: number,
): RoutePosition {
  const { waypoints, loop } = route;
  const { waypointIndex, progress } = currentPosition;

  const timeInHours = deltaTime / (1000 * 60 * 60);
  const distanceTraveled = speed * timeInHours;

  const currentWaypoint = waypoints[waypointIndex];
  const nextWaypointIndex = (waypointIndex + 1) % waypoints.length;
  const nextWaypoint = waypoints[nextWaypointIndex];

  const deltaLat = nextWaypoint.lat - currentWaypoint.lat;
  const deltaLng = nextWaypoint.lng - currentWaypoint.lng;
  const segmentDistance = Math.sqrt(deltaLat * deltaLat + deltaLng * deltaLng) * 111; // Rough conversion to km

  const progressIncrement = distanceTraveled / segmentDistance;
  let newProgress = progress + progressIncrement;

  let newWaypointIndex = waypointIndex;

  if (newProgress >= 1) {
    newProgress = newProgress - 1;
    newWaypointIndex = nextWaypointIndex;

    if (newWaypointIndex === 0 && !loop) {
      newWaypointIndex = waypoints.length - 1;
      newProgress = 1;
    }
  }

  const currentWp = waypoints[newWaypointIndex];
  const nextWp = waypoints[(newWaypointIndex + 1) % waypoints.length];

  const lat = lerp(currentWp.lat, nextWp.lat, newProgress);
  const lng = lerp(currentWp.lng, nextWp.lng, newProgress);
  const targetSpeed = lerp(currentWp.targetSpeed, nextWp.targetSpeed, newProgress);

  return {
    lat,
    lng,
    targetSpeed,
    waypointIndex: newWaypointIndex,
    progress: newProgress,
  };
}

/**
 * Get initial position on a route
 */
export function getInitialPosition(route: Route): RoutePosition {
  const firstWaypoint = route.waypoints[0];
  return {
    lat: firstWaypoint.lat,
    lng: firstWaypoint.lng,
    targetSpeed: firstWaypoint.targetSpeed,
    waypointIndex: 0,
    progress: 0,
  };
}

/**
 * Get random position on a route (useful for distributing vehicles)
 */
export function getRandomPosition(route: Route): RoutePosition {
  const waypointIndex = Math.floor(Math.random() * route.waypoints.length);
  const progress = Math.random();

  const currentWp = route.waypoints[waypointIndex];
  const nextWp = route.waypoints[(waypointIndex + 1) % route.waypoints.length];

  const lat = lerp(currentWp.lat, nextWp.lat, progress);
  const lng = lerp(currentWp.lng, nextWp.lng, progress);
  const targetSpeed = lerp(currentWp.targetSpeed, nextWp.targetSpeed, progress);

  return {
    lat,
    lng,
    targetSpeed,
    waypointIndex,
    progress,
  };
}
