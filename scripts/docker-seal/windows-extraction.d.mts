export interface ExtractionCommand {
  readonly label: string;
  readonly argv: readonly string[];
  readonly timeout: number;
}
export function gitExtractionCommands(scratch: string, target: string): readonly ExtractionCommand[];
