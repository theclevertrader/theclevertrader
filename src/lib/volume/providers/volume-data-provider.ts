import { NormalizedTick, VolumeDataSource } from '../volume-types';

export interface VolumeDataProvider {
  sourceName: VolumeDataSource;
  isAvailable(): boolean;
  getTicks(symbol: string, limit?: number): Promise<NormalizedTick[]>;
  recordTick(tick: NormalizedTick): void;
}
