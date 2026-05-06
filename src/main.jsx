import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { UserProvider } from './context/UserContext.jsx';
import Dashboard from "./pages/Dashboard.jsx";
import App from './App.jsx';
import FruitDisplay from './FruitDisplay.jsx';
import LandingPage from './pages/LandingPage.jsx';
import FruitSlice from './pages/FruitSlice.jsx';
import FruitSliceBasic from './pages/FruitSliceBasic.jsx';
import FruitCompare from './pages/FruitCompare.jsx';
import FruitCompareBasic from './pages/FruitCompareBasic.jsx';
import ARSlice from './pages/ARSlice.jsx';
import ARPage from './components/ARPage.jsx';
import HealthProfile from './pages/HealthProfile.jsx';
import ARCompare from './pages/ARCompare.jsx';
import RecipePage from "./pages/RecipePage.jsx";
import RecipeResultPage from "./pages/RecipeResultPage";
import DietitianChatPage from './pages/DietitianChatPage.jsx';
import SemanticFilter from './pages/SemanticFilter.jsx';
import AdaptiveLayout from './pages/AdaptiveLayout.jsx';
import Login from './pages/Login.jsx';
import Signup from './pages/Signup.jsx';
import EditProfile from './pages/EditProfile.jsx';

import FruitScannerPage from "./pages/FruitScannerPage.jsx";

import YogaHubPage from './pages/YogaHubPage.tsx';


import Community from './pages/Community.jsx';

import './styles.css';
import DesktopViewer from './pages/DesktopViewer.jsx';

ReactDOM.createRoot(document.getElementById('root')).render(
  <UserProvider>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/profile" element={<EditProfile />} />
        <Route path="/app" element={<App />} />
        <Route path="/display" element={<FruitDisplay />} />
        <Route path="/slice" element={<FruitSlice />} />
        <Route path="/slicebasic" element={<FruitSliceBasic />} />
        <Route path="/compare" element={<FruitCompare />} />
        <Route path="/comparebasic" element={<FruitCompareBasic />} />
        <Route path="/ar-slice" element={<ARSlice />} />
        <Route path="/ar" element={<ARPage />} />
        <Route path="/ar-compare" element={<ARCompare />} />
        <Route path="/health" element={<HealthProfile />} />
        <Route path="/community" element={<Community />} />
        <Route path="/viewer" element={<DesktopViewer />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/recipe" element={<RecipePage />} />
        <Route path="/recipe/result" element={<RecipeResultPage />} />
        <Route path="/chat" element={<DietitianChatPage />} />
        <Route path="/semantic-filter" element={<SemanticFilter />} />
        <Route path="/adaptive-layout" element={<AdaptiveLayout />} />

        <Route path="/scanner" element={<FruitScannerPage />} />

        <Route path="/yoga" element={<YogaHubPage />} />


      </Routes>
    </BrowserRouter>
  </UserProvider>
);
