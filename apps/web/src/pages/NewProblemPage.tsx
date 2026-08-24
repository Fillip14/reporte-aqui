import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { createProblem } from '../api/problems';
import { uploadMedia } from '../api/media';
import { listCompanies } from '../api/companies';
import Button from '../components/Button';
import Alert from '../components/Alert';
import { LABEL_CLASSES, INPUT_CLASSES } from '../lib/formClasses';

const CREATE_ERROR_MESSAGE = 'Não foi possível criar o problema. Tente novamente.';
const CEP_NOT_FOUND_MESSAGE = 'CEP não encontrado.';

async function lookupCep(cep: string): Promise<string | null> {
  const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
  const data = await response.json();
  if (data.erro) return null;
  return `${data.logradouro}, ${data.bairro}, ${data.localidade} - ${data.uf}`;
}

export default function NewProblemPage() {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [cep, setCep] = useState('');
  const [cepError, setCepError] = useState<string | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [responsibleCompanyId, setResponsibleCompanyId] = useState('');
  const companiesQuery = useQuery({ queryKey: ['companies'], queryFn: listCompanies });

  async function handleCepBlur() {
    const digits = cep.replace(/\D/g, '');
    if (digits.length !== 8) return;
    setCepError(null);
    const address = await lookupCep(digits);
    if (address) {
      setLocation(address);
    } else {
      setCepError(CEP_NOT_FOUND_MESSAGE);
    }
  }

  const mutation = useMutation({
    mutationFn: async () => {
      const media = await Promise.all(files.map((file) => uploadMedia(file)));
      return createProblem({
        title,
        description,
        location,
        media,
        responsibleCompanyId: responsibleCompanyId || undefined,
      });
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
    <div className="mx-auto max-w-lg">
      <h1 className="text-2xl font-semibold text-slate-900">Reportar problema</h1>
      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label htmlFor="title" className={LABEL_CLASSES}>
            Título
          </label>
          <input
            id="title"
            required
            minLength={5}
            maxLength={200}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={INPUT_CLASSES}
          />
        </div>

        <div>
          <label htmlFor="description" className={LABEL_CLASSES}>
            Descrição
          </label>
          <textarea
            id="description"
            required
            minLength={20}
            maxLength={5000}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className={INPUT_CLASSES}
            rows={4}
          />
        </div>

        <div>
          <label htmlFor="cep" className={LABEL_CLASSES}>
            CEP (opcional)
          </label>
          <input
            id="cep"
            value={cep}
            onChange={(e) => setCep(e.target.value)}
            onBlur={handleCepBlur}
            className={INPUT_CLASSES}
          />
          {cepError && <p className="mt-1 text-sm text-red-600">{cepError}</p>}
        </div>

        <div>
          <label htmlFor="location" className={LABEL_CLASSES}>
            Localização
          </label>
          <input
            id="location"
            required
            minLength={5}
            maxLength={300}
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className={INPUT_CLASSES}
          />
        </div>

        <div>
          <label htmlFor="responsibleCompanyId" className={LABEL_CLASSES}>
            Empresa responsável (opcional)
          </label>
          <select
            id="responsibleCompanyId"
            value={responsibleCompanyId}
            onChange={(e) => setResponsibleCompanyId(e.target.value)}
            className={INPUT_CLASSES}
          >
            <option value="">Nenhuma</option>
            {companiesQuery.data?.map((company) => (
              <option key={company.id} value={company.id}>
                {company.companyName}
              </option>
            ))}
          </select>
          {companiesQuery.isError && (
            <p className="mt-1 text-sm text-red-600">Não foi possível carregar a lista de empresas.</p>
          )}
        </div>

        <div>
          <label htmlFor="media" className={LABEL_CLASSES}>
            Fotos/vídeos (1 a 5 arquivos)
          </label>
          <input
            id="media"
            type="file"
            multiple
            accept="image/*,video/*"
            onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
            className="mt-1 block w-full text-sm text-slate-700"
          />
        </div>

        {error && <Alert>{error}</Alert>}

        <Button type="submit" disabled={mutation.isPending} className="w-full">
          Enviar
        </Button>
      </form>
    </div>
  );
}
