import { GoogleGenerativeAI } from "@google/generative-ai";
import type { AIProvider } from "./provider.interface.js";
import type { ProjectConfig } from "../../config/store.js";
import type { Platform } from "../../types/index.js";

export class GeminiProvider implements AIProvider {
    private model: any;

    constructor(apiKey: string) {
        const genAI = new GoogleGenerativeAI(apiKey);
        // 1.5 Flash is great for high-volume technical diffs
        this.model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    }

    
}