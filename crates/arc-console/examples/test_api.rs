extern crate arc_console;
use arc_console::process::ProcessDetector;

fn main() {
    let mut detector = ProcessDetector::new();

    match detector.detect_instances() {
        Ok(instances) => {
            println!("Found {} instances:", instances.len());
            for instance in instances {
                println!(
                    "  - PID: {}, Workspace: {:?}, Type: {:?}",
                    instance.pid, instance.workspace, instance.instance_type
                );
            }
        }
        Err(e) => {
            eprintln!("Error: {}", e);
        }
    }
}
