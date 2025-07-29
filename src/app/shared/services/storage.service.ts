import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class StorageService {
  get(key: string): string | null {
    if (typeof window !== 'undefined' && window.localStorage) {
      return localStorage.getItem(key);
    }
    return null;
  }

  set(key: string, value: string): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(key, value);
    }
  }

  remove(key: string): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.removeItem(key);
    }
  }
}
