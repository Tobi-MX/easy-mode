import * as p from '@clack/prompts';
import { ConfigStore, ProjectConfig } from '../config/store.js';

export async function runSetupWizard(): Promise<ProjectConfig> {
    const project = await p.group(
    {
      projectName: () => 
        p.text({ 
          message: 'What is the name of this project?', 
          placeholder: 'e.g., Easy Mode CLI',
          validate: (value: string | undefined): string | Error | undefined => {
            if (!value || value.length < 1) return 'Project name is required';
          }
        }),

      projectDescription: () => 
        p.text({ 
          message: 'What is the primary goal of this software?', 
          placeholder: 'e.g., Automating social proof for developers',
          validate: (value: string | undefined): string | Error | undefined => {
            if (!value || value.length < 10) return 'Please provide a more descriptive goal (min 10 chars)';
          }
        }),
    },
    
    {
      onCancel: () => {
        p.cancel('Setup cancelled.');
        process.exit(0);
      },
    }
  );

    // Save it to disk so they never see this screen again
    ConfigStore.save(project);
    return project;
} 