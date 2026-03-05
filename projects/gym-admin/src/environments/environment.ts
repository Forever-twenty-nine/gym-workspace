import { Environment } from 'gym-library';

export const environment: Environment = {
    production: false,
    useEmulator: true,
    firebase: {
        apiKey: 'demo',
        authDomain: 'demo.firebaseapp.com',
        projectId: 'default-project',
        storageBucket: 'default-project.appspot.com',
        messagingSenderId: '123456789',
        appId: '1:123456789:web:demo',
        measurementId: 'G-DEMO',
    },
};
