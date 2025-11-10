export interface ApiServiceGeneratorSchema {
  name: string;
  directory?: string;
  withLogfire?: boolean;
  withHexagonal?: boolean;
  tags?: string;
}
