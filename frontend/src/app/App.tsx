import { RouterProvider } from 'react-router';
import { router } from './routes';
import { SkillProofProvider } from "./context/SkillProofContext";

export default function App() {
  return (
    <SkillProofProvider>
      <RouterProvider router={router} />
    </SkillProofProvider>
  );
}
