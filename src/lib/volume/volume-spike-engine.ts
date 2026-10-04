import { VolumeSpikeResult, VolumeSpikeClassification } from './volume-types';
import { VolumeEngineConfig, DEFAULT_VOLUME_CONFIG } from './volume-config';
import { calculateMeanAndStdDev } from './volume-utils';

export class VolumeSpikeEngine {
  /**
   * Detects volume spikes and statistical anomalies using Z-scores
   */
  public static detectSpikes(
    recentVolumes: number[],
    currentVolume: number,
    symbol: string = 'UNKNOWN',
    config: VolumeEngineConfig = DEFAULT_VOLUME_CONFIG
  ): VolumeSpikeResult {
    if (recentVolumes.length < 3) {
      return {
        symbol,
        currentVolume,
        averageVolume: currentVolume,
        standardDeviation: 0,
        volumeZScore: 0,
        classification: 'NORMAL',
        isSpike: false,
        timestamp: Date.now(),
      };
    }

    const { mean, stdDev } = calculateMeanAndStdDev(recentVolumes);
    const zScore = stdDev > 0 ? (currentVolume - mean) / stdDev : 0;

    const { elevated, spike, extreme } = config.spikeZThresholds;
    let classification: VolumeSpikeClassification = 'NORMAL';

    if (zScore >= extreme) {
      classification = 'EXTREME';
    } else if (zScore >= spike) {
      classification = 'SPIKE';
    } else if (zScore >= elevated) {
      classification = 'ELEVATED';
    }

    return {
      symbol,
      currentVolume: Math.round(currentVolume * 100) / 100,
      averageVolume: Math.round(mean * 100) / 100,
      standardDeviation: Math.round(stdDev * 100) / 100,
      volumeZScore: Math.round(zScore * 100) / 100,
      classification,
      isSpike: zScore >= spike,
      timestamp: Date.now(),
    };
  }
}
