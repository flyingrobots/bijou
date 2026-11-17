export interface TemplateConsumerManifest {
  readonly name: string;
  readonly private: boolean;
  readonly dependencies: Readonly<Record<string, string>>;
  readonly devDependencies: Readonly<Record<string, string>>;
}
export function templateConsumerManifest(source: string): TemplateConsumerManifest;
