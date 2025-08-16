export interface SimulationResponse {
  canvasHtml: string;
  jsCode: string;
  explanation: string;
  usage?: {
    totalTokens: number;
  };
  contentWarning?: boolean;
  warningMessage?: string;
}

export interface User {
  email: string | undefined;
  id: string;
}
