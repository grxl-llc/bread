/**
 * pages.config.js - Page routing configuration
 * 
 * This file is AUTO-GENERATED. Do not add imports or modify PAGES manually.
 * Pages are auto-registered when you create files in the ./pages/ folder.
 * 
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 * 
 * Example file structure:
 * 
 *   import HomePage from './pages/HomePage';
 *   import Dashboard from './pages/Dashboard';
 *   import Settings from './pages/Settings';
 *   
 *   export const PAGES = {
 *       "HomePage": HomePage,
 *       "Dashboard": Dashboard,
 *       "Settings": Settings,
 *   }
 *   
 *   export const pagesConfig = {
 *       mainPage: "HomePage",
 *       Pages: PAGES,
 *   };
 * 
 * Example with Layout (wraps all pages):
 *
 *   import Home from './pages/Home';
 *   import Settings from './pages/Settings';
 *   import __Layout from './Layout.jsx';
 *
 *   export const PAGES = {
 *       "Home": Home,
 *       "Settings": Settings,
 *   }
 *
 *   export const pagesConfig = {
 *       mainPage: "Home",
 *       Pages: PAGES,
 *       Layout: __Layout,
 *   };
 *
 * To change the main page from HomePage to Dashboard, use find_replace:
 *   Old: mainPage: "HomePage",
 *   New: mainPage: "Dashboard",
 *
 * The mainPage value must match a key in the PAGES object exactly.
 */
import AdminDashboard from './pages/AdminDashboard';
import AdvertiserPortal from './pages/AdvertiserPortal';
import CollectionDetail from './pages/CollectionDetail';
import CreatorDashboard from './pages/CreatorDashboard';
import Deals from './pages/Deals';
import GroceryList from './pages/GroceryList';
import Home from './pages/Home';
import Messages from './pages/Messages';
import MonetizationInfo from './pages/MonetizationInfo';
import Notifications from './pages/Notifications';
import Onboarding from './pages/Onboarding';
import Pantry from './pages/Pantry';
import Recipes from './pages/Recipes';
import RecipeSearch from './pages/RecipeSearch';
import Settings from './pages/Settings';
import Tutorials from './pages/Tutorials';
import UserProfile from './pages/UserProfile';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AdminDashboard": AdminDashboard,
    "AdvertiserPortal": AdvertiserPortal,
    "CollectionDetail": CollectionDetail,
    "CreatorDashboard": CreatorDashboard,
    "Deals": Deals,
    "GroceryList": GroceryList,
    "Home": Home,
    "Messages": Messages,
    "MonetizationInfo": MonetizationInfo,
    "Notifications": Notifications,
    "Onboarding": Onboarding,
    "Pantry": Pantry,
    "Recipes": Recipes,
    "RecipeSearch": RecipeSearch,
    "Settings": Settings,
    "Tutorials": Tutorials,
    "UserProfile": UserProfile,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};
// Note: "/" route is handled by pagesConfig mainPage loop in App.jsx