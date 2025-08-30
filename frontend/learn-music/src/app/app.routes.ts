import { Routes } from '@angular/router';
import { MainPanelComponent } from './main-panel/main-panel.component';
import { LandingPageComponent } from './landing-page/landing-page.component';
import { EarTrainComponent } from './ear-train/ear-train.component';
import {SignupComponent} from './signup/signup.component'
import { EditProfileComponent } from './edit-profile/edit-profile.component';

export const routes: Routes = [
    {
        path: '',
        component: LandingPageComponent
    },
    {
        path: 'invata',
        component: MainPanelComponent
    },
    {
        path: 'auz',
        component: EarTrainComponent
    },
    {
        path: 'inregistrare',
        component: SignupComponent
    },
    {
        path: 'edit-profile',
        component: EditProfileComponent
    }
];
