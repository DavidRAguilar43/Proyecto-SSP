import React from 'react';

// Importación directa para test
type TipoUsuario = 'alumno' | 'docente' | 'personal';

const TipoUsuarioTest: React.FC = () => {
  const tipos: TipoUsuario[] = ['alumno', 'docente', 'personal'];

  return (
    <div>
      <h1>Test TipoUsuario (Sin importación externa)</h1>
      {tipos.map(tipo => (
        <div key={tipo}>{tipo}</div>
      ))}
    </div>
  );
};

export default TipoUsuarioTest;
