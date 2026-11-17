-- Arregla "no me deja guardar un cliente nuevo" después de haber corrido 0005.
--
-- Causa: 0005 cargó los 94 clientes con su número fijo (1 a 94), pero el contador automático de la tabla
-- quedó en 1. Al crear un cliente desde la app, la base le asignaba el número 1, que ya existe, y rechazaba
-- el guardado por número duplicado.
--
-- Se puede correr las veces que haga falta: solo deja el contador en el número más alto que haya.
select setval(pg_get_serial_sequence('public.clientes', 'numero'), (select max(numero) from public.clientes));

-- Control: el próximo cliente tiene que ser el 95.
select (select max(numero) from public.clientes) + 1 as proximo_numero;
