import { MeetingForm } from "@/modules/meetings/ui/components/meeting-form";

const CreateMeetingPage = () => {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Create Meeting</h1>
        <p className="text-muted-foreground">Enter a name for your meeting and select an agent to join.</p>
      </div>
      
      <MeetingForm />
    </div>
  );
};

export default CreateMeetingPage;
