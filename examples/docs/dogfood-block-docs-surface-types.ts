export interface DogfoodDocsSurfaceSearchState {
  readonly query: string;
  readonly hitCount: number;
}

export interface DogfoodDocsSurfaceProofArtifact {
  readonly id: string;
  readonly label: string;
  readonly available: boolean;
}

export interface DogfoodDocsSurfaceBlockConfig {
  readonly docsTree?: readonly string[];
  readonly selectedRoute?: string;
  readonly selectedRouteLabel?: string;
  readonly selectedHeadingId?: string;
  readonly searchState?: DogfoodDocsSurfaceSearchState;
  readonly proofArtifacts?: readonly DogfoodDocsSurfaceProofArtifact[];
}

export interface DogfoodDocsSurfaceSchemaData {
  readonly docsTree: readonly string[];
  readonly selectedRoute: string;
  readonly selectedRouteLabel?: string;
  readonly selectedHeadingId: string;
  readonly searchState: DogfoodDocsSurfaceSearchState;
  readonly proofArtifacts: readonly DogfoodDocsSurfaceProofArtifact[];
}
