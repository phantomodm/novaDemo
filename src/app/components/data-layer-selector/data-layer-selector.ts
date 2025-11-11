import { Component, inject, computed} from '@angular/core';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectChange } from '@angular/material/select';
import { DATA_LAYERS, LAYER_KEYS } from '../../core/models/features.model';
import { GlobeState } from '../../core/services/globe-state';

@Component({
  selector: 'app-data-layer-selector',
  imports: [MatFormFieldModule,MatSelectModule],
  templateUrl: './data-layer-selector.html',
  styleUrl: './data-layer-selector.css',
})
export class DataLayerSelector {
  private globeStateService = inject(GlobeState);
  public globeLayerKeys = LAYER_KEYS;
  public globeLayerNames = DATA_LAYERS;
  label:string = 'Active Data Layer';

  selectedGlobeLayer = computed(() => {
    this.globeStateService.selectedLayer()
  });

  constructor() {}

  // --- NEW: Update the local property on change ---
  onLayerChange(event: MatSelectChange) {
    const layerKey = event.value;
    this.globeStateService.setSelectedLayer(layerKey);
  }
}
