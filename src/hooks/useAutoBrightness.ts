import { useEffect, useRef } from 'react';
import { LightSensor } from 'expo-sensors';
import * as Brightness from 'expo-brightness';

function luxToBrightness(lux: number): number {
  if (lux <= 0)    return 0.1;
  if (lux <= 10)   return 0.15;
  if (lux <= 50)   return 0.25;
  if (lux <= 200)  return 0.40;
  if (lux <= 500)  return 0.55;
  if (lux <= 1000) return 0.70;
  if (lux <= 5000) return 0.85;
  return 1.0;
}

export function useAutoBrightness() {
  const subscriptionRef = useRef<any>(null);
  const lastBrightnessRef = useRef<number>(-1);

  useEffect(() => {
    let active = true;

    const start = async () => {
      // 1. Verificar permiso
      const { status } = await Brightness.requestPermissionsAsync();
      console.log('[Brillo] Permiso:', status);
      if (status !== 'granted' || !active) return;

      // 2. Verificar sensor
      const available = await LightSensor.isAvailableAsync();
      console.log('[Brillo] Sensor disponible:', available);
      if (!available || !active) return;

      LightSensor.setUpdateInterval(500);

      subscriptionRef.current = LightSensor.addListener(({ illuminance }) => {
        if (!active) return;
        const target = luxToBrightness(illuminance);
        // ✅ Esto aparece en tu terminal → confirma que el sensor funciona
        // console.log(`[Brillo] Lux: ${illuminance.toFixed(1)} → Pantalla: ${(target * 100).toFixed(0)}%`);

        if (Math.abs(target - lastBrightnessRef.current) >= 0.05) {
          lastBrightnessRef.current = target;
          Brightness.setSystemBrightnessAsync(target).catch(() => {
            Brightness.setBrightnessAsync(target).catch(() => {});
          });
        }
      });
    };

    start();

    return () => {
      active = false;
      subscriptionRef.current?.remove();
      Brightness.useSystemBrightnessAsync().catch(() => {});
    };
  }, []);
}