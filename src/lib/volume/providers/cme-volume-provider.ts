import { VolumeDataProvider } from './volume-data-provider';
import { NormalizedTick, VolumeDataSource } from '../volume-types';

/**
 * Clean adapter interface for CME (Chicago Mercantile Exchange) Futures volume.
 * STRICT POLICY: Kept disabled until legitimate institutional credentials/license are configured.
 * Never fabricates fake centralized volume for OTC spot Forex.
 */
export class CMEVolumeProvider implements VolumeDataProvider {
  public sourceName: VolumeDataSource = 'SYNTHETIC';
  public readonly isSupported: boolean = false;
  public readonly reason: string = 'No institutional CME futures data credentials configured in environment.';

  public isAvailable(): boolean {
    return false; // Explicitly disabled
  }

  public recordTick(_tick: NormalizedTick): void {
    // No-op while disabled
  }

  public async getTicks(_symbol: string, _limit?: number): Promise<NormalizedTick[]> {
    return [];
  }
}

export const globalCmeVolumeProvider = new CMEVolumeProvider();
