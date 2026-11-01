(function (root, factory) {
  const createCarePathDemo = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = createCarePathDemo;
  if (root) root.WAYPOINT_CAREPATH = createCarePathDemo;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  function createCarePathDemo() {
    const now = Date.now();
    const projectId = 'demo-carepath';
    const project = {
      id: projectId,
      demoId: 'healthcare-research',
      isDemo: true,
      name: 'CarePath: after discharge',
      createdAt: now - 86400000,
      updatedAt: now - 3600000,
      brief: {
        question: 'How might people feel more confident following a care plan after leaving the hospital?',
        audience: 'Adults managing a new diagnosis and the people who support them.',
        scope: 'Understand instructions, follow-up tasks, and caregiver coordination.',
        timeframe: 'Class prototype',
        limits: 'Fictional example only. Not medical advice or real patient research.'
      },
      chats: [{
        id: 'demo-carepath-chat',
        title: 'Making sense of discharge',
        createdAt: now - 7200000,
        updatedAt: now - 3600000,
        messages: [
          {
            id: 'demo-message-1',
            role: 'user',
            text: 'I’m exploring what feels difficult after someone leaves the hospital. How should I start?',
            createdAt: now - 7100000
          },
          {
            id: 'demo-message-2',
            role: 'assistant',
            text: 'For this demo, start with the moments right after getting home: remembering next steps, knowing who to call, and explaining the plan to someone helping.',
            links: [
              {
                title: 'AHRQ: IDEAL discharge planning',
                url: 'https://www.ahrq.gov/patient-safety/settings/hospital/resource/guide.html'
              },
              {
                title: 'AHRQ: Health literacy universal precautions',
                url: 'https://www.ahrq.gov/health-literacy/improve/precautions/index.html'
              }
            ],
            createdAt: now - 7000000
          },
          {
            id: 'demo-message-3',
            role: 'user',
            text: 'How could I learn whether those are real pain points?',
            createdAt: now - 6900000
          },
          {
            id: 'demo-message-4',
            role: 'assistant',
            text: 'A useful next step could be a short, consent-based conversation about one recent discharge. Ask what happened, what they referred to, and where they felt unsure. These are sample prompts, not generated research advice.',
            searchPrompt: 'patient experience after hospital discharge instructions follow up care qualitative research',
            createdAt: now - 6800000
          }
        ]
      }],
      notes: [
        {
          id: 'demo-note-1',
          text: 'In a fictional interview, a care partner says the written plan was clear at the hospital but hard to use once they got home.',
          source: 'Sample interview · fictional',
          tags: ['Observation'],
          createdAt: now - 5000000
        },
        {
          id: 'demo-note-2',
          text: 'How might a shared checklist help without adding more work for a caregiver?',
          source: 'Demo research question · fictional',
          tags: ['Question'],
          createdAt: now - 4500000
        },
        {
          id: 'demo-note-3',
          text: 'Assumption to test: people want reminders from an app rather than a person they trust.',
          source: 'Demo assumption · fictional',
          tags: ['Assumption'],
          createdAt: now - 4000000
        },
        {
          id: 'demo-note-4',
          text: 'A support person may need a clear way to see the next agreed step without interpreting clinical instructions.',
          source: 'Sample synthesis · fictional',
          tags: ['Care'],
          createdAt: now - 3500000
        },
        {
          id: 'demo-note-5',
          text: 'Resource idea: link to the care team’s approved discharge materials rather than restating medical guidance.',
          source: 'Sample idea · fictional',
          tags: ['Resource'],
          createdAt: now - 3000000
        }
      ],
      people: [],
      tags: ['Care', 'Resource'],
      links: []
    };
    const people = [
      {
        id: 'demo-person-leena',
        name: 'Leena Rao',
        role: 'Care partner · fictional',
        notes: 'Sample profile for the healthcare app demo.',
        isDemo: true,
        demoProjectId: projectId,
        createdAt: now - 3600000
      },
      {
        id: 'demo-person-maya',
        name: 'Dr. Maya Sen',
        role: 'Family physician · fictional',
        notes: 'Sample profile for the healthcare app demo.',
        isDemo: true,
        demoProjectId: projectId,
        createdAt: now - 3500000
      },
      {
        id: 'demo-person-arun',
        name: 'Arun Nair',
        role: 'Patient advocate · fictional',
        notes: 'Sample profile for the healthcare app demo.',
        isDemo: true,
        demoProjectId: projectId,
        createdAt: now - 3400000
      }
    ];
    return { project, people };
  }
  createCarePathDemo.mergeProject = function mergeCarePathProject(project, fixture) {
    project.isDemo = true;
    project.demoId = 'healthcare-research';
    project.links = Array.isArray(project.links) ? project.links : [];
    project.chats = Array.isArray(project.chats) ? project.chats : [];
    const seedChat = fixture.chats[0];
    let chat = project.chats.find(item => item.id === seedChat.id);
    if (!chat) {
      chat = { ...seedChat, messages: seedChat.messages.map(message => ({ ...message })) };
      project.chats.unshift(chat);
      return project;
    }
    chat.messages = Array.isArray(chat.messages) ? chat.messages : [];
    seedChat.messages.forEach(seedMessage => {
      const message = chat.messages.find(item => item.id === seedMessage.id);
      if (!message) {
        chat.messages.push({ ...seedMessage });
      } else {
        if (seedMessage.links) message.links = seedMessage.links.map(link => ({ ...link }));
        if (seedMessage.searchPrompt) message.searchPrompt = seedMessage.searchPrompt;
      }
    });
    return project;
  };
  return createCarePathDemo;
});
