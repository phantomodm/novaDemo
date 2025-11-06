import { Directive, ElementRef, inject, OnInit } from '@angular/core';
declare var Cesium: any;

@Directive({
  selector: '[appCesium]'
})
export class CesiumDirective implements OnInit{
  private el = inject(ElementRef);
  
  constructor() { }

  ngOnInit(): void {
    const viewer = new Cesium.Viewer(this.el.nativeElement)
  }

}
