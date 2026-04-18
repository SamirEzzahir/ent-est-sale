def build_prompt(user: dict, question: str, files: list[dict], selected_file: dict | None) -> str:
    selected_context = "No specific file selected."
    if selected_file:
        selected_context = (
            f"Selected file:\n"
            f"- filename: {selected_file.get('filename', '')}\n"
            f"- course_name: {selected_file.get('course_name', '')}\n"
            f"- uploaded_by: {selected_file.get('uploaded_by', '')}\n"
            f"- upload_date: {selected_file.get('upload_date', '')}\n"
        )

    file_lines = []
    for file in files[:8]:
        file_lines.append(
            f"- {file.get('filename', 'unknown')} | course={file.get('course_name', 'unknown')} | "
            f"owner={file.get('uploaded_by', 'unknown')}"
        )

    available_resources = "\n".join(file_lines) if file_lines else "- No files available."

    return f"""
You are the ENT EST Sale AI assistant.
Answer in French unless the user asks for another language.
Be concise, helpful, and honest about uncertainty.
Do not invent file contents you have not received.

Current user:
- username: {user.get("username", "")}
- role: {user.get("role", "")}
- email: {user.get("email", "")}

Available resources from download-service:
{available_resources}

{selected_context}

User question:
{question.strip()}

If the user asks about a file's exact content, explain that this MVP only knows metadata unless text is provided later.
""".strip()


def build_fallback_answer(user: dict, question: str, files: list[dict], selected_file: dict | None) -> str:
    if selected_file:
        return (
            f"Je fonctionne actuellement en mode MVP sans reponse Ollama disponible. "
            f"Je peux deja confirmer que la ressource selectionnee est "
            f"\"{selected_file.get('filename', 'inconnue')}\" dans le cours "
            f"\"{selected_file.get('course_name', 'inconnu')}\" et qu'elle a ete ajoutee par "
            f"\"{selected_file.get('uploaded_by', 'inconnu')}\". "
            f"Pour votre question \"{question.strip()}\", je peux vous aider a partir des metadonnees, "
            f"mais pas encore du contenu integral du document."
        )

    if files:
        course_names = ", ".join(sorted({file.get("course_name", "inconnu") for file in files[:5]}))
        return (
            f"Je fonctionne actuellement en mode MVP sans reponse Ollama disponible. "
            f"Je vois {len(files)} ressource(s) accessible(s) pour {user.get('username', 'cet utilisateur')}, "
            f"avec notamment les cours suivants : {course_names}. "
            f"Posez une question plus ciblee sur un fichier ou un cours et je pourrai utiliser ce contexte."
        )

    return (
        f"Je fonctionne actuellement en mode MVP sans reponse Ollama disponible. "
        f"Aucune ressource n'a ete remontee depuis download-service pour l'instant, "
        f"mais votre question a bien ete recue : \"{question.strip()}\"."
    )
