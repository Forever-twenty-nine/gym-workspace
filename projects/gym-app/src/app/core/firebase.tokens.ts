import { InjectionToken } from '@angular/core';
import { Firestore } from 'firebase/firestore';
import { Auth } from 'firebase/auth';

export const FIRESTORE = new InjectionToken<Firestore>('FIRESTORE');
export const AUTH = new InjectionToken<Auth>('AUTH');
