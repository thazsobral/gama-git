import React from 'react';
import { GitHubBranch } from '../../types';

export interface TimeMachineProps {
  owner: string;
  repo: string;
  branches: GitHubBranch[];
  currentBranch: string;
}

declare const TimeMachine: React.FC<TimeMachineProps>;

export default TimeMachine;
