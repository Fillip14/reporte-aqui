import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { createProblem } from '../api/problems';
import { uploadMedia } from '../api/media';

const CREATE_ERROR_MESSAGE = 'Não foi possível criar o problema. Tente novamente.';

export default function NewProblemPage() {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: async () => {
      const media = await Promise.all(files.map((file) => uploadMedia(file)));
      return createProblem({ title, description, location, media });
    },
    onSuccess: (problem) => navigate(`/problems/${problem.id}`),
    onError: () => setError(CREATE_ERROR_MESSAGE),
  });

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (files.length === 0) {
      setError('Adicione ao menos uma foto ou vídeo.');
      return;
    }
    if (files.length > 5) {
      setError('No máximo 5 arquivos de mídia.');
      return;
    }
    mutation.mutate();
  }

  return (
    <div>
      <h1>Reportar problema</h1>
      <form onSubmit={handleSubmit}>
        <label htmlFor="title">Título</label>
        <input
          id="title"
          required
          minLength={5}
          maxLength={200}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <label htmlFor="description">Descrição</label>
        <textarea
          id="description"
          required
          minLength={20}
          maxLength={5000}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <label htmlFor="location">Localização</label>
        <input
          id="location"
          required
          minLength={5}
          maxLength={300}
          value={location}
          onChange={(e) => setLocation(e.target.value)}
        />

        <label htmlFor="media">Fotos/vídeos (1 a 5 arquivos)</label>
        <input
          id="media"
          type="file"
          multiple
          accept="image/*,video/*"
          onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
        />

        {error && <p role="alert">{error}</p>}

        <button type="submit" disabled={mutation.isPending}>
          Enviar
        </button>
      </form>
    </div>
  );
}
