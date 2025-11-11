import { Injectable , signal } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { LAYER_KEYS, DATA_LAYERS, DataLayerKey } from '../models/features.model';



@Injectable({
  providedIn: 'root'
})
export class GlobeState {
  // Public map of layer names for the UI
  public layerNames = DATA_LAYERS;  
  // Public list of keys for the UI to loop over
  public layerKeys = LAYER_KEYS as DataLayerKey[];
  selectedLayer = signal<DataLayerKey>('final_ci');

  constructor() {}
  
  /**
   * Called by the <mat-select> dropdown when the user
   * picks a new layer to visualize.
   */
  setSelectedLayer(layerKey: string) {
    const typedKey = layerKey as DataLayerKey;
    if (this.layerNames[typedKey]) {
      this.selectedLayer.set(typedKey);
    } else {
      console.error("Unknown layer key:", layerKey);
    }
  }
}
