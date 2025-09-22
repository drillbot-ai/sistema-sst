"use client";

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import axios from "axios";
import { useParams, useRouter } from "next/navigation";
import ListShell from "../../../components/ListShell";
import FormRenderer from "../../../components/forms/FormRenderer";

interface FormDetails {
  code: string;
  name: string;
  version: number;
  schema: any;
}

export default function FormCapturePage() {
  const { code } = useParams<{ code: string }>();
  const router = useRouter();
  // local state for form data
  const [formData, setFormData] = useState<any>({});
  // fetch form definition
  const {
    data: form,
    isLoading,
    isError,
  } = useQuery<FormDetails>({
    queryKey: ["form", code],
    queryFn: async () => {
      const res = await axios.get<FormDetails>(
        `http://localhost:3002/api/forms/${code}`
      );
      return res.data;
    },
  });
  // mutation to create a draft submission
  const createSubmission = useMutation({
    mutationFn: async (data: any) => {
      const res = await axios.post(
        `http://localhost:3002/api/forms/${code}/submissions`,
        { data }
      );
      return res.data;
    },
    onSuccess: (sub: any) => {
      router.push(`/formularios/${code}/submissions`);
    },
  });
  return (
    <ListShell
      title={form ? `${form.code} – ${form.name}` : `Formulario ${code}`}
      subtitle="Diligencia el formulario y guarda el registro."
      actions={
        <button
          className="btn btn-primary"
          onClick={() => createSubmission.mutate(formData)}
          disabled={isLoading || isError}
        >
          Guardar
        </button>
      }
    >
      {isLoading && (
        <div className="card p-4">Cargando formulario…</div>
      )}
      {isError && (
        <div className="card p-4 text-rose-600">
          No se pudo cargar el formulario.
        </div>
      )}
      {form && (
        <FormRenderer
          schema={form.schema}
          value={formData}
          onChange={setFormData}
        />
      )}
    </ListShell>
  );
}