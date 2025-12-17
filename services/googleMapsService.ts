import { NavigationState } from "../types";

/**
 * Mocks the behavior of the Google Maps Directions API.
 * In a production app, this would use `fetch('https://maps.googleapis.com/maps/api/directions/json?...')`
 */

// Generates a "Real-looking" street path (Zig-Zag and curves) between two simulated points
const generatePolyline = (startX: number, startY: number, endX: number, endY: number): {x:number, y:number}[] => {
    const points: {x:number, y:number}[] = [{x: startX, y: startY}];
    const segments = 8;
    
    let currentX = startX;
    let currentY = startY;
    
    for(let i=1; i<=segments; i++) {
        const t = i/segments;
        // Target for this segment
        const targetX = startX + (endX - startX) * t;
        const targetY = startY + (endY - startY) * t;

        // Add "Street Turn" logic - moving in 90 degree angles or slight curves
        // If it's an even segment, move X, else move Y (Manhattan distance style movement)
        if (i % 2 === 0) {
            currentX = targetX + (Math.random() - 0.5) * 5; // Variation
            currentY = targetY;
        } else {
            currentX = targetX;
            currentY = targetY + (Math.random() - 0.5) * 5;
        }
        
        points.push({x: currentX, y: currentY});
    }
    
    // Ensure we end exactly at the destination
    points.push({x: endX, y: endY});
    return points;
};

export const fetchDirections = async (
    origin: {x: number, y: number}, 
    destination: {x: number, y: number}
): Promise<NavigationState> => {
    
    // Simulate Network Latency
    await new Promise(resolve => setTimeout(resolve, 800));

    const points = generatePolyline(origin.x, origin.y, destination.x, destination.y);
    
    // Mock Instructions based on API response structure
    const streets = ["Av. Brasil", "Rua das Acácias", "Rua Pedro II", "Alameda Santos"];
    const maneuvers = ["Vire à direita", "Vire à esquerda", "Siga em frente", "Na rotatória"];
    
    const randomStreet = streets[Math.floor(Math.random() * streets.length)];
    const randomManeuver = maneuvers[Math.floor(Math.random() * maneuvers.length)];

    return {
        currentPolyline: points,
        distance: `${(Math.random() * 3 + 0.5).toFixed(1)} km`,
        duration: `${Math.floor(Math.random() * 10 + 2)} min`,
        nextManeuver: randomManeuver,
        nextStreet: `na ${randomStreet}`,
        stepDistance: `${Math.floor(Math.random() * 400 + 100)}m`
    };
};

/**
 * Decodes Google Maps Polyline Algorithm (Mock Implementation)
 * In production, use @googlemaps/polyline-codec
 */
export const decodePolyline = (encoded: string) => {
    // This is where we would decode the string "u{~vFvyys@..."
    // For this mock, we just return dummy array
    return [];
};
