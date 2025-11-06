import { Injectable } from '@angular/core';

declare let Cesium: any;
Cesium.Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJiMDFmZjdiZS1mZWU0LTQ5MzktOTgxMC1jZTE2ZGE1YjhmMGUiLCJpZCI6MzUxMzI5LCJpYXQiOjE3NjA2NjI2NjF9.y_HaG_nTARNbnLD_S0FQUwEcUFJypnZ2kGxha2MgUjw';

@Injectable({
  providedIn: 'root'
})
export class CesiumService {


  private viewer: any;
  constructor() { }

  plotPoints(div:string){
    this.viewer = new Cesium.Viewer(div);
    this.viewer.entities.add({
      position: Cesium.Cartesian3.fromDegrees(-75.59777, 40.03883),
      point: {
        color: Cesium.Color.RED,
        pixelSize: 16,
      },
    });
    this.viewer.entities.add({
      position: Cesium.Cartesian3.fromDegrees(-80.5, 35.14),
      point: {
        color: Cesium.Color.BLUE,
        pixelSize: 16,
      },
    });
    this.viewer.entities.add({
      position: Cesium.Cartesian3.fromDegrees(-80.12, 25.46),
      point: {
        color: Cesium.Color.YELLOW,
        pixelSize: 16,
      },
    });
  }

  
}
