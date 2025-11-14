import React from 'react';
import RoutePlanner from './RoutePlanner';

import { usePageTitle } from '../hooks/usePageTitle';
export default function RoutePlannerAdmin() {
  // Set page title
  usePageTitle("Route Planner Admin - Navigation Management");

  return <RoutePlanner/>;
}


