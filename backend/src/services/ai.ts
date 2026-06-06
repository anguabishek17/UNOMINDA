const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const isMockMode = !GEMINI_API_KEY || GEMINI_API_KEY === 'mock';

// Rich, domain-specific domain mock outputs for manufacturing machines
const MOCK_AI_DATABASE: Record<string, { warnings: string[]; checklist: string[]; summary: string; bullets: string[] }> = {
  CNC: {
    warnings: [
      "CRITICAL: High rotational speed spindle. Never open enclosure during operation.",
      "WARNING: Hot metallic chips (swarf) ejected during cutting. Always wear ANSI Z87.1 approved safety goggles.",
      "CAUTION: Entanglement hazard. Loose clothing, ties, or uncontained long hair must be secured before starting spindle.",
      "NOTICE: Lubricant levels must be checked every 8 hours. Running dry will cause tool weld and catastrophic breakage."
    ],
    checklist: [
      "Verify that safety doors and interlocks are fully functional and not bypassed.",
      "Ensure tool offsets are correctly loaded and verified in the controller.",
      "Check fluid levels for coolant and slide-way oil.",
      "Clear any accumulated swarf or debris from the limit switches and axes.",
      "Perform a dry run (Z-axis offset +50mm) for any newly uploaded program.",
      "Verify the emergency stop button is fully functional and clear of obstructions."
    ],
    summary: "This document describes the standard startup, operation, and shutdown sequences for CNC milling and lathe centers. It emphasizes pre-operational calibration, safety door locking mechanism tests, and standard tool path verification procedures to prevent tool crash, operator injury, or dimensional deviancy in production parts.",
    bullets: [
      "Conduct pre-operation inspection including oil level, coolant density, and air pressure checks.",
      "Load program via DNC/USB and double-verify G-code coordinates against job routing sheet.",
      "Secure workpiece in the vise/chuck and verify clamping pressure settings.",
      "Perform program dry-run or single-block execution for the first part of the batch.",
      "Engage vacuum or chip conveyor systems to prevent swarf build-up.",
      "Conduct post-operational cleaning and log tool wear metrics in the supervisor portal."
    ]
  },
  PRESS: {
    warnings: [
      "CRITICAL: Extreme crushing force. Keep hands, limbs, and clothing clear of the die area.",
      "WARNING: Double-palm controls are safety critical. Never attempt to clamp, lock, or wire down controls.",
      "WARNING: Flywheel momentum remains active after power-down. Wait 120 seconds before entering die space.",
      "CAUTION: High-pressure hydraulic fluid. Pinholes can inject fluid under skin. Use cardboard, not hands, to check for leaks."
    ],
    checklist: [
      "Test light curtains (pass hand through to verify press cycle halts instantly).",
      "Confirm both palm buttons require simultaneous activation to stroke the press.",
      "Check pressure gauges to ensure hydraulic pressure is within the safe zone (150-180 bar).",
      "Verify safety blocks are in place before performing die adjustments or cleanings.",
      "Check die-clamping bolts for correct torque specs."
    ],
    summary: "This manual covers the operating procedures for hydraulic and mechanical stamping presses. It details safety guard alignment, press stroke settings, dual-control validation, and strict lock-out/tag-out (LOTO) protocols required during die maintenance or clearing sheet jam operations.",
    bullets: [
      "Always engage safety block before reaching inside the die bed for any reason.",
      "Verify that the light curtain transmitter and receiver modules are clean and aligned.",
      "Ensure proper stock feed alignment to prevent double-metal stamp or misfeed conditions.",
      "Inspect press frame and slide for visual cracks, wear, or lubrication pooling.",
      "Shut down motor, wait for flywheel rotation to stop, and tag out power before leaving machine."
    ]
  },
  WELD: {
    warnings: [
      "CRITICAL: Intense UV/IR arc radiation. Welding helmet with shade rating 10+ is mandatory.",
      "WARNING: Toxic welding fumes and gases. Always activate the localized fume extraction arm.",
      "CAUTION: High current electric shock risk. Keep gloves, boots, and workplace dry. Do not touch live electrodes.",
      "NOTICE: Remove all flammable materials within 10 meters of the welding area to prevent flash fires."
    ],
    checklist: [
      "Verify the fume extractor hood is positioned directly over the weld joint (10-15cm).",
      "Inspect welding leads and ground clamp for cracked insulation or loose connections.",
      "Ensure fire extinguisher (Type ABC) is charged and stationed within reach.",
      "Check gas cylinder pressure and check hoses for shielding gas leaks using soapy water.",
      "Confirm helmet auto-darkening cartridge triggers upon spark ignition."
    ],
    summary: "This SOP provides guidelines for Gas Metal Arc Welding (MIG) and Gas Tungsten Arc Welding (TIG) stations. Focus areas include personal protective equipment (PPE), fume extraction, cylinder safety, and electrical shock mitigation in damp conditions.",
    bullets: [
      "Wear flame-resistant leather apron, heavy leather welding gloves, and safety boots.",
      "Set gas flow regulator according to material thickness and weld procedure sheet.",
      "Attach work ground clamp directly to the metal workpiece or welding bench.",
      "Always shut off shielding gas cylinders at the main valve when welding is completed.",
      "Never weld on containers or pipes that have held flammable liquids or gases."
    ]
  },
  GENERIC: {
    warnings: [
      "CRITICAL: Ensure the machine electrical panel is closed and locked.",
      "WARNING: Wear appropriate PPE including steel-toed safety boots, safety glasses, and ear protection.",
      "CAUTION: Keep workspace clean and clear of oil spills to prevent slips and falls.",
      "NOTICE: Report any unusual noise, vibration, or warning lights to the supervisor immediately."
    ],
    checklist: [
      "Verify that the machine and work area are clean and free of scrap or clutter.",
      "Perform a visual inspection of all electrical cables and power cords.",
      "Ensure all physical guards and safety panels are closed and secured.",
      "Verify the emergency stop button is accessible and clean.",
      "Ensure you have read and understood the relevant SOP before turning on power."
    ],
    summary: "This document outlines standard industrial machine handling, safety operations, general hazard compliance, and emergency reporting protocols for plant machinery. It stresses standard warning indicators, regular maintenance cycles, and workspace safety standards.",
    bullets: [
      "Wear complete personal protective equipment (PPE) before entering the production floor.",
      "Confirm the machine status indicator light is green before commencing shifts.",
      "Do not operate machinery under the influence of medications causing drowsiness.",
      "Report any minor electrical faults or fluid leaks to maintenance departments.",
      "Shut down machine and switch off main breaker at the end of the shift."
    ]
  }
};

function getMachineCategory(machineNameOrType: string): string {
  const query = machineNameOrType.toUpperCase();
  if (query.includes('CNC') || query.includes('MILL') || query.includes('LATHE') || query.includes('ROUTER')) {
    return 'CNC';
  }
  if (query.includes('PRESS') || query.includes('STAMP') || query.includes('BEND') || query.includes('HYDRAULIC')) {
    return 'PRESS';
  }
  if (query.includes('WELD') || query.includes('ARC') || query.includes('TIG') || query.includes('MIG')) {
    return 'WELD';
  }
  return 'GENERIC';
}

export const aiService = {
  /**
   * Suggest safety warnings based on machine type or name
   */
  async suggestSafetyWarnings(machineName: string, machineCode: string): Promise<string[]> {
    if (isMockMode) {
      const category = getMachineCategory(machineName || machineCode);
      return MOCK_AI_DATABASE[category].warnings;
    }

    try {
      const prompt = `You are a manufacturing safety officer. Provide 4 specific safety warnings for a machine named "${machineName}" (Code: "${machineCode}"). Format as a JSON array of strings. Do not include markdown formatting or wrappers outside the raw JSON array. Make them professional and highly relevant to the machine type.`;
      const responseText = await callGeminiAPI(prompt);
      return parseJsonArray(responseText, MOCK_AI_DATABASE[getMachineCategory(machineName)].warnings);
    } catch (error) {
      console.error('Gemini API call failed, falling back to mock warnings.', error);
      return MOCK_AI_DATABASE[getMachineCategory(machineName)].warnings;
    }
  },

  /**
   * Auto-generate a safety checklist for a machine or standard operating procedure
   */
  async generateSafetyChecklist(machineName: string, title: string, textContext?: string): Promise<string[]> {
    if (isMockMode) {
      const category = getMachineCategory(machineName || title);
      return MOCK_AI_DATABASE[category].checklist;
    }

    try {
      const prompt = `Generate a 5-6 item safety inspection checklist for operating "${machineName}" for the task "${title}". ${
        textContext ? `Use the following context if helpful: "${textContext}".` : ''
      } Format as a JSON array of strings. Return ONLY the raw JSON array, without any markdown backticks or formatting.`;
      const responseText = await callGeminiAPI(prompt);
      return parseJsonArray(responseText, MOCK_AI_DATABASE[getMachineCategory(machineName)].checklist);
    } catch (error) {
      console.error('Gemini API call failed, falling back to mock checklist.', error);
      return MOCK_AI_DATABASE[getMachineCategory(machineName)].checklist;
    }
  },

  /**
   * Summarize a long SOP or instruction text context
   */
  async summarizeSOP(title: string, textContent: string): Promise<string> {
    if (isMockMode || !textContent || textContent.length < 50) {
      const category = getMachineCategory(title);
      return MOCK_AI_DATABASE[category].summary;
    }

    try {
      const prompt = `Summarize the following Standard Operating Procedure (SOP) titled "${title}" in a clear 2-3 sentence paragraph focusing on core safety and startup instructions. Content: "${textContent.substring(0, 4000)}"`;
      return await callGeminiAPI(prompt);
    } catch (error) {
      console.error('Gemini API call failed, falling back to mock summary.', error);
      return MOCK_AI_DATABASE[getMachineCategory(title)].summary;
    }
  },

  /**
   * Convert an instruction text into high-impact bullet points
   */
  async convertToBulletPoints(title: string, textContent: string): Promise<string[]> {
    if (isMockMode || !textContent || textContent.length < 50) {
      const category = getMachineCategory(title);
      return MOCK_AI_DATABASE[category].bullets;
    }

    try {
      const prompt = `Convert the following operational guide/SOP titled "${title}" into 5 action-oriented bullet points for shopfloor operators. Return ONLY a JSON array of strings representing the bullet points. Do not wrap in markdown or backticks. Content: "${textContent.substring(0, 4000)}"`;
      const responseText = await callGeminiAPI(prompt);
      return parseJsonArray(responseText, MOCK_AI_DATABASE[getMachineCategory(title)].bullets);
    } catch (error) {
      console.error('Gemini API call failed, falling back to mock bullets.', error);
      return MOCK_AI_DATABASE[getMachineCategory(title)].bullets;
    }
  }
};

/**
 * Native REST API caller for Google Gemini API
 */
async function callGeminiAPI(prompt: string): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            {
              text: prompt
            }
          ]
        }
      ]
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API returned HTTP status ${response.status}: ${errorText}`);
  }

  const json: any = await response.json();
  const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error('Invalid response format from Gemini API.');
  }

  return text.trim();
}

/**
 * Utility function to clean up and parse JSON array returns from LLM responses
 */
function parseJsonArray(text: string, fallback: string[]): string[] {
  try {
    // Clean markdown code blocks if the model ignored instructions
    let cleaned = text.trim();
    if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```(json)?/, '').replace(/```$/, '').trim();
    }
    return JSON.parse(cleaned);
  } catch (error) {
    console.warn('Failed to parse AI JSON response, searching for array inside response.', text);
    const arrayMatch = text.match(/\[\s*".*"\s*\]/s);
    if (arrayMatch) {
      try {
        return JSON.parse(arrayMatch[0]);
      } catch (innerError) {
        // Fallback
      }
    }
    return fallback;
  }
}
