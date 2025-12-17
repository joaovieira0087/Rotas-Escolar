import { GoogleGenAI, Type } from "@google/genai";
import { Student, RouteStop, NavigationLeg } from "../types";

// This simulates a "Traveling Salesperson" solution using Gemini's reasoning capabilities
// since we don't have access to the Google Maps Routes Matrix API in this demo environment.
export const optimizeRouteOrder = async (
  startAddress: string,
  endAddress: string,
  students: Student[]
): Promise<string[]> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.warn("API Key not found, returning original order");
    return students.map(s => s.id);
  }

  const ai = new GoogleGenAI({ apiKey });

  // Prepare the prompt context
  const stopsList = students.map((s, index) => ({
    id: s.id,
    address: s.address,
    name: s.name
  }));

  const prompt = `
    You are a logistics expert for a school transport system.
    Task: Optimize the order of stops to minimize travel time and distance.

    Start Point: ${startAddress}
    End Point: ${endAddress}

    Intermediate Stops (Students):
    ${JSON.stringify(stopsList)}

    Instructions:
    1. Organize the Intermediate Stops in the most logical sequence to go from Start to End.
    2. Consider real-world geography based on the addresses provided.
    3. Return ONLY a JSON array of strings, where each string is the 'id' of the student in the optimized order.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.STRING
          }
        }
      }
    });

    const jsonText = response.text;
    if (!jsonText) throw new Error("No text returned from Gemini");
    
    const optimizedIds = JSON.parse(jsonText) as string[];
    return optimizedIds;

  } catch (error) {
    console.error("Gemini optimization failed:", error);
    // Fallback: return original order
    return students.map(s => s.id);
  }
};

export const validateAddress = async (address: string): Promise<{ isValid: boolean; suggestions: string }> => {
    const apiKey = process.env.API_KEY;
    if (!apiKey) return { isValid: true, suggestions: "API Key missing, validation skipped" };

    const ai = new GoogleGenAI({ apiKey });

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Analyze this address for a logistics app in Brazil: "${address}". 
            Is it likely a valid, routable address? 
            Return JSON: { "isValid": boolean, "formattedAddress": string }`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        isValid: { type: Type.BOOLEAN },
                        formattedAddress: { type: Type.STRING }
                    }
                }
            }
        });

        const result = JSON.parse(response.text || "{}");
        return { isValid: result.isValid, suggestions: result.formattedAddress };
    } catch (e) {
        return { isValid: true, suggestions: "Validation service unavailable" };
    }
}

// Simulates the Google Directions API
export const getSimulatedNavigationLeg = async (
    startPoint: {x: number, y: number}, 
    endPoint: {x: number, y: number},
    nextAddress: string
): Promise<NavigationLeg> => {
    
    // We create a "wiggly" line between the two points to simulate real roads
    const points: {x: number, y: number}[] = [];
    const steps = 20;
    
    // Linear Interpolation with noise
    for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        // Basic Lerp
        const lx = startPoint.x + (endPoint.x - startPoint.x) * t;
        const ly = startPoint.y + (endPoint.y - startPoint.y) * t;
        
        // Add "Road Noise" (except at start and end)
        const noiseX = (i === 0 || i === steps) ? 0 : (Math.random() - 0.5) * 5; 
        const noiseY = (i === 0 || i === steps) ? 0 : (Math.random() - 0.5) * 5;

        points.push({ x: lx + noiseX, y: ly + noiseY });
    }

    // Mock Instructions based on random chance
    const instructions = [
        "Siga em frente por 2km",
        "Vire à direita em 300m",
        "Na rotatória, pegue a 2ª saída",
        "Mantenha-se à esquerda na bifurcação"
    ];
    const randomInstruction = instructions[Math.floor(Math.random() * instructions.length)];

    return {
        polyline: points,
        distance: `${(Math.random() * 5 + 1).toFixed(1)} km`,
        duration: `${Math.floor(Math.random() * 15 + 5)} min`,
        instruction: randomInstruction
    };
}
