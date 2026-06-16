--
-- PostgreSQL database dump
--

\restrict LhJLDDsAcfvPkRq198PtKRMSE7z5puPUJdNt8Zngj6az7kF5IMEIyNphQ2FiRWl

-- Dumped from database version 18.3
-- Dumped by pg_dump version 18.3

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: pharmacies; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.pharmacies (
    id integer NOT NULL,
    name character varying(150) NOT NULL,
    address character varying(255),
    city character varying(100),
    phone character varying(20),
    email character varying(150),
    latitude numeric(10,8),
    longitude numeric(11,8),
    amo_supported boolean DEFAULT true,
    api_url character varying(255) NOT NULL
);


ALTER TABLE public.pharmacies OWNER TO postgres;

--
-- Name: pharmacies_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.pharmacies_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.pharmacies_id_seq OWNER TO postgres;

--
-- Name: pharmacies_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.pharmacies_id_seq OWNED BY public.pharmacies.id;


--
-- Name: pharmacies id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pharmacies ALTER COLUMN id SET DEFAULT nextval('public.pharmacies_id_seq'::regclass);


--
-- Data for Name: pharmacies; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.pharmacies (id, name, address, city, phone, email, latitude, longitude, amo_supported, api_url) FROM stdin;
1	Pharmacie DB1	Rue 125 Porte 45	Bamako	+22370000001	db1@pharma.ml	12.62000000	-7.99000000	t	http://localhost:3001
2	Pharmacie DB2	Avenue Modibo Keita	Bamako	+22370000002	db2@pharma.ml	12.63920000	-8.00290000	t	http://localhost:3002
3	Pharmacie DB3	Quartier Badalabougou	Bamako	+22370000003	db3@pharma.ml	12.63000000	-8.01500000	t	http://localhost:3003
\.


--
-- Name: pharmacies_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.pharmacies_id_seq', 4, true);


--
-- Name: pharmacies pharmacies_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pharmacies
    ADD CONSTRAINT pharmacies_pkey PRIMARY KEY (id);


--
-- PostgreSQL database dump complete
--

\unrestrict LhJLDDsAcfvPkRq198PtKRMSE7z5puPUJdNt8Zngj6az7kF5IMEIyNphQ2FiRWl

