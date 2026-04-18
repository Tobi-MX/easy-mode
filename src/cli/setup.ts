import * as p from '@clack/prompts';
import { ConfigStore, ProjectConfig, ProjectConfigSchema } from '../config/store';

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

      tone: () =>
        p.select({
          message: 'Choose your professional tone:',
          options: [
            { value: 'builder', label: '🛠️ Builder', hint: 'Direct, focuses on shipping and implementation' },
            { value: 'stoic', label: '⚖️ Stoic', hint: 'Minimalist, high-authority, logic-driven' },
            { value: 'academic', label: '🎓 Academic', hint: 'Precise, focuse on theory, and correctness' },
            { value: 'energetic', label: '🚀 Energetic', hint: 'High-momentum, focuses on growth and impact' },
          ],
        }),

      bannedWords: () =>
        p.text({
          message: 'Enter words the AI should NEVER use (comma separated):',
          placeholder: 'e.g., excited, delve, tapestry, leveraging, delighted',
        }),
    },

    {
      onCancel: () => {
        p.cancel('Setup cancelled.');
        process.exit(0);
      },
    }
  );

  // Clean and transform the data
  const config: ProjectConfig = {
    projectName: project.projectName,
    projectDescription: project.projectDescription,
    styleProfile: {
      tone: project.tone as 'builder' | 'stoic' | 'academic' | 'energetic',
      bannedWords: project.bannedWords
        .split(',')
        .map(w => w.trim().toLowerCase())
        .filter(w => w.length > 0),
      vocabulary: ['logic', 'architecture', 'shipping', 'signal']
    }
  };

  ConfigStore.save(config);
  return config;
} 